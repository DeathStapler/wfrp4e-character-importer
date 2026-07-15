/**
 * Item import module for the WFRP 4e Character Importer.
 *
 * Handles importing skills, talents, careers, trappings, weapons,
 * armour, and money from the export JSON into Foundry Items.
 *
 * Prioritizes duplicating items from compendiums. Only creates custom
 * items when no compendium match exists.
 *
 * @module itemImporter
 */

import { info, warn, debug, createWarningContext } from "./logger.js";
import { findItem } from "./compendiumLookup.js";
import { clamp } from "./utilities.js";
import {
  ITEM_TYPE,
  MONEY_COIN_VALUE,
  MONEY_NAME_MAP,
  SKILL_CHARACTERISTIC_DEFAULTS,
} from "./mappings.js";

/**
 * Import summary tracking for a single import operation.
 * @typedef {object} ImportSummary
 * @property {number} skillsImported
 * @property {number} skillsCreated
 * @property {number} skillsSkipped
 * @property {number} talentsImported
 * @property {number} talentsCreated
 * @property {number} talentsSkipped
 * @property {number} careersImported
 * @property {number} careersSkipped
 * @property {number} trappingsImported
 * @property {number} trappingsCreated
 * @property {number} trappingsSkipped
 * @property {number} weaponsImported
 * @property {number} armourImported
 * @property {number} moneyImported
 * @property {string[]} warnings
 */

/**
 * Create a fresh import summary.
 *
 * @returns {ImportSummary}
 */
export function createSummary() {
  return {
    skillsImported: 0,
    skillsCreated: 0,
    skillsSkipped: 0,
    talentsImported: 0,
    talentsCreated: 0,
    talentsSkipped: 0,
    careersImported: 0,
    careersSkipped: 0,
    trappingsImported: 0,
    trappingsCreated: 0,
    trappingsSkipped: 0,
    weaponsImported: 0,
    armourImported: 0,
    moneyImported: 0,
    warnings: [],
  };
}

/**
 * Import skills from the export JSON.
 *
 * Searches compendiums for each skill. If found, duplicates the compendium
 * item and sets advances. If not found, creates a custom skill item.
 *
 * @param {object[]} skills - The skills array from export JSON.
 * @param {string} characterName - Character name for warning context.
 * @param {ImportSummary} summary - The summary to update.
 * @returns {Promise<object[]>} Array of item data objects for Actor.createEmbeddedDocuments.
 */
export async function importSkills(skills, characterName, summary) {
  if (!Array.isArray(skills)) return [];

  const items = [];

  for (const skill of skills) {
    if (!skill?.name) {
      summary.skillsSkipped++;
      summary.warnings.push(`Skipped skill at index ${items.length}: missing name.`);
      continue;
    }

    const advances = clamp(skill.advances ?? 0, 0, Infinity);

    const compendiumItem = await findItem({
      identifier: skill.skillId,
      name: skill.name,
      itemType: ITEM_TYPE.SKILL,
      characterName,
    });

    if (compendiumItem) {
      const itemData = compendiumItem.toObject();
      itemData.system.advances.value = advances;
      items.push(itemData);
      summary.skillsImported++;
      debug(`Imported skill "${skill.name}" with ${advances} advances from compendium.`);
    } else {
      // Create custom skill
      const itemData = createCustomSkill(skill.name, advances);
      items.push(itemData);
      summary.skillsCreated++;
      warn(`Skill not found in compendiums`, createWarningContext(
        characterName, "Skill", skill.name, "Created custom skill item.",
      ));
    }
  }

  return items;
}

/**
 * Create a custom skill item data object.
 *
 * @param {string} name - The skill name.
 * @param {number} advances - The number of advances.
 * @returns {object} Item data for createEmbeddedDocuments.
 */
function createCustomSkill(name, advances) {
  const characteristic = SKILL_CHARACTERISTIC_DEFAULTS[name] ?? "ws";

  return {
    name,
    type: ITEM_TYPE.SKILL,
    system: {
      description: { value: "" },
      advanced: { value: "" },
      grouped: { value: "noSpec" },
      characteristic: { value: characteristic },
      advances: { value: advances, costModifier: 0, force: false },
      modifier: { value: 0 },
      total: { value: 0 },
    },
  };
}

/**
 * Import talents from the export JSON.
 *
 * @param {object[]} talents - The talents array from export JSON.
 * @param {string} characterName - Character name for warning context.
 * @param {ImportSummary} summary - The summary to update.
 * @returns {Promise<object[]>} Array of item data objects.
 */
export async function importTalents(talents, characterName, summary) {
  if (!Array.isArray(talents)) return [];

  const items = [];

  for (const talent of talents) {
    if (!talent?.name) {
      summary.talentsSkipped++;
      summary.warnings.push(`Skipped talent at index ${items.length}: missing name.`);
      continue;
    }

    const timesTaken = clamp(talent.timesTaken ?? 1, 1, Infinity);

    const compendiumItem = await findItem({
      identifier: talent.talentId,
      name: talent.name,
      itemType: ITEM_TYPE.TALENT,
      characterName,
    });

    if (compendiumItem) {
      const itemData = compendiumItem.toObject();
      itemData.system.advances.value = timesTaken;
      items.push(itemData);
      summary.talentsImported++;
      debug(`Imported talent "${talent.name}" (${timesTaken} advances) from compendium.`);
    } else {
      const itemData = createCustomTalent(talent.name, timesTaken);
      items.push(itemData);
      summary.talentsCreated++;
      warn(`Talent not found in compendiums`, createWarningContext(
        characterName, "Talent", talent.name, "Created custom talent item.",
      ));
    }
  }

  return items;
}

/**
 * Create a custom talent item data object.
 *
 * @param {string} name - The talent name.
 * @param {number} advances - The number of advances (times taken).
 * @returns {object} Item data for createEmbeddedDocuments.
 */
function createCustomTalent(name, advances) {
  return {
    name,
    type: ITEM_TYPE.TALENT,
    system: {
      description: { value: "" },
      max: { value: "1" },
      advances: { value: advances, force: false },
      career: { value: "" },
      tests: { value: "" },
    },
  };
}

/**
 * Import a career from the export JSON.
 *
 * Searches compendiums for the career by ID or name. If found,
 * duplicates it and sets it as current with the specified level.
 *
 * @param {string} careerId - The career ID from export JSON.
 * @param {number} careerLevel - The career level (1-4).
 * @param {string} characterName - Character name for warning context.
 * @param {ImportSummary} summary - The summary to update.
 * @returns {Promise<object|null>} Career item data, or null if not found.
 */
export async function importCareer(careerId, careerLevel, characterName, summary) {
  if (!careerId) {
    summary.careersSkipped++;
    summary.warnings.push("No career ID provided — skipping career import.");
    return null;
  }

  const level = clamp(careerLevel ?? 1, 1, 4);

  const compendiumItem = await findItem({
    identifier: careerId,
    name: careerId,
    itemType: ITEM_TYPE.CAREER,
    characterName,
  });

  if (!compendiumItem) {
    // Try name-based search with capitalized ID
    const compendiumItemByName = await findItem({
      name: careerId.replace(/-/g, " "),
      itemType: ITEM_TYPE.CAREER,
      characterName,
    });

    if (!compendiumItemByName) {
      summary.careersSkipped++;
      warn(`Career not found in compendiums`, createWarningContext(
        characterName, "Career", careerId, "No compendium match found.",
      ));
      return null;
    }

    return configureCareerItem(compendiumItemByName, level, summary);
  }

  return configureCareerItem(compendiumItem, level, summary);
}

/**
 * Configure a career item from a compendium match.
 *
 * @param {Item} compendiumItem - The compendium career item.
 * @param {number} level - The career level (1-4).
 * @param {ImportSummary} summary - The summary to update.
 * @returns {object} Career item data.
 */
function configureCareerItem(compendiumItem, level, summary) {
  const itemData = compendiumItem.toObject();
  itemData.system.current.value = true;
  itemData.system.complete.value = false;
  itemData.system.level.value = level;
  summary.careersImported++;
  debug(`Imported career "${itemData.name}" at level ${level}.`);
  return itemData;
}

/**
 * Import trappings from the export JSON.
 *
 * Searches compendiums for each trapping. If not found, creates a
 * custom trapping item.
 *
 * @param {object[]} trappings - The trappings array from export JSON.
 * @param {string} characterName - Character name for warning context.
 * @param {ImportSummary} summary - The summary to update.
 * @returns {Promise<object[]>} Array of item data objects.
 */
export async function importTrappings(trappings, characterName, summary) {
  if (!Array.isArray(trappings)) return [];

  const items = [];

  for (const trapping of trappings) {
    if (!trapping?.name) {
      summary.trappingsSkipped++;
      summary.warnings.push(`Skipped trapping at index ${items.length}: missing name.`);
      continue;
    }

    const quantity = clamp(trapping.quantity ?? 1, 1, Infinity);

    const compendiumItem = await findItem({
      identifier: trapping.trappingId,
      name: trapping.name,
      characterName,
    });

    if (compendiumItem) {
      const itemData = compendiumItem.toObject();
      if (itemData.system?.quantity) {
        itemData.system.quantity.value = quantity;
      }
      items.push(itemData);
      summary.trappingsImported++;
      debug(`Imported trapping "${trapping.name}" from compendium.`);

      // Track if it's actually a weapon or armour
      if (compendiumItem.type === ITEM_TYPE.WEAPON) summary.weaponsImported++;
      if (compendiumItem.type === ITEM_TYPE.ARMOUR) summary.armourImported++;
    } else {
      const itemData = createCustomTrapping(trapping.name, quantity);
      items.push(itemData);
      summary.trappingsCreated++;
      warn(`Trapping not found in compendiums`, createWarningContext(
        characterName, "Trapping", trapping.name, "Created custom trapping item.",
      ));
    }
  }

  return items;
}

/**
 * Create a custom trapping item data object.
 *
 * @param {string} name - The trapping name.
 * @param {number} quantity - The quantity.
 * @returns {object} Item data for createEmbeddedDocuments.
 */
function createCustomTrapping(name, quantity) {
  return {
    name,
    type: ITEM_TYPE.TRAPPING,
    system: {
      description: { value: "", gmdescription: { value: "" } },
      quantity: { value: quantity },
      encumbrance: { value: 0 },
      price: { gc: 0, ss: 0, bp: 0 },
      availability: { value: "" },
      location: { value: 0 },
      trappingType: { value: "" },
      worn: false,
      spellIngredient: { value: "" },
      qualities: { value: [] },
      flaws: { value: [] },
    },
  };
}

/**
 * Create money items from the export JSON wealth data.
 *
 * WFRP4e uses three money item types (Gold Crown, Silver Shilling,
 * Brass Penny) with quantities.
 *
 * @param {object} wealth - The wealth object from export JSON.
 * @param {ImportSummary} summary - The summary to update.
 * @returns {Promise<object[]>} Array of money item data objects.
 */
export async function importMoney(wealth, summary) {
  if (!wealth) return [];

  const items = [];

  for (const [key, coinValue] of Object.entries(MONEY_COIN_VALUE)) {
    const amount = wealth[key];
    if (!amount || amount <= 0) continue;

    const name = MONEY_NAME_MAP[key];

    // Try to find the money item in compendiums
    const compendiumItem = await findItem({
      name,
      itemType: ITEM_TYPE.MONEY,
    });

    if (compendiumItem) {
      const itemData = compendiumItem.toObject();
      itemData.system.quantity.value = amount;
      items.push(itemData);
    } else {
      items.push({
        name,
        type: ITEM_TYPE.MONEY,
        system: {
          description: { value: "", gmdescription: { value: "" } },
          quantity: { value: amount },
          encumbrance: { value: 0 },
          location: { value: 0 },
          coinValue: { value: coinValue },
        },
      });
    }

    summary.moneyImported++;
    debug(`Imported ${amount} ${name}.`);
  }

  return items;
}
