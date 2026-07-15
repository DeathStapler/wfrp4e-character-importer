/**
 * Centralized data mapping tables for the WFRP 4e Character Importer.
 *
 * This is the ONLY module that should know Foundry/WFRP4e property paths.
 * All other modules reference these constants instead of hardcoding paths.
 *
 * @module mappings
 */

/**
 * Maps export JSON characteristic keys to WFRP4e system characteristic keys.
 * @type {Record<string, string>}
 */
export const CHARACTERISTIC_MAP = {
  WS: "ws",
  BS: "bs",
  S: "s",
  T: "t",
  I: "i",
  Ag: "ag",
  Dex: "dex",
  Int: "int",
  WP: "wp",
  Fel: "fel",
};

/**
 * The base system path for characteristics on an actor.
 * @type {string}
 */
export const CHARACTERISTIC_PATH = "system.characteristics";

/**
 * Maps export JSON species IDs to WFRP4e config species keys.
 * @type {Record<string, string>}
 */
export const SPECIES_MAP = {
  human: "human",
  dwarf: "dwarf",
  halfling: "halfling",
  "high-elf": "helf",
  "wood-elf": "welf",
  "gnome": "gnome",
  ogre: "ogre",
};

/**
 * Maps export JSON career level (1-4) to WFRP4e career level strings.
 * @type {Record<number, string>}
 */
export const CAREER_LEVEL_MAP = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
};

/**
 * WFRP4e Item types that this importer can create.
 * @type {Record<string, string>}
 */
export const ITEM_TYPE = {
  SKILL: "skill",
  TALENT: "talent",
  CAREER: "career",
  TRAPPING: "trapping",
  WEAPON: "weapon",
  ARMOUR: "armour",
  MONEY: "money",
  SPELL: "spell",
};

/**
 * Money denomination mapping from export JSON to WFRP4e money item coin values.
 * @type {Record<string, number>}
 */
export const MONEY_COIN_VALUE = {
  gold: 240, // 1 GC = 240 pence (d)
  silver: 12, // 1 SS = 12 pence (d)
  brass: 1,  // 1 BP = 1 penny (d)
};

/**
 * Maps export JSON wealth keys to WFRP4e money item names.
 * @type {Record<string, string>}
 */
export const MONEY_NAME_MAP = {
  gold: "Gold Crown",
  silver: "Silver Shilling",
  brass: "Brass Penny",
};

/**
 * Actor system data paths for core fields.
 * @type {Record<string, string>}
 */
export const ACTOR_PATH = {
  SPECIES: "system.details.species.value",
  SPECIES_SUB: "system.details.species.subspecies",
  AGE: "system.details.age.value",
  HEIGHT: "system.details.height.value",
  WEIGHT: "system.details.weight.value",
  HAIR: "system.details.haircolour.value",
  EYES: "system.details.eyecolour.value",
  GENDER: "system.details.gender.value",
  BIOGRAPHY: "system.details.biography.value",
  EXPERIENCE_TOTAL: "system.details.experience.total",
  EXPERIENCE_SPENT: "system.details.experience.spent",
  FATE: "system.status.fate.value",
  FORTUNE: "system.status.fortune.value",
  RESILIENCE: "system.status.resilience.value",
  RESOLVE: "system.status.resolve.value",
  WOUNDS_VALUE: "system.status.wounds.value",
  WOUNDS_MAX: "system.status.wounds.max",
  ADVANTAGE: "system.status.advantage.value",
  CORRUPTION: "system.status.corruption.value",
  SIN: "system.status.sin.value",
  MOVE: "system.details.move.value",
};

/**
 * WFRP4e compendium pack names to search for items.
 * Listed in priority order.
 * @type {string[]}
 */
export const COMPENDIUM_PACKS = [
  "wfrp4e-core.items",
  "wfrp4e-core.skills",
  "wfrp4e-core.talents",
  "wfrp4e-core.careers",
  "wfrp4e-core.trappings",
  "wfrp4e-core.weapons",
  "wfrp4e-core.armours",
  "wfrp4e-core.spells",
  "wfrp4e-basic.items",
];

/**
 * Skill characteristic mapping for WFRP4e skills.
 * Maps skill names to their default characteristic.
 * @type {Record<string, string>}
 */
export const SKILL_CHARACTERISTIC_DEFAULTS = {
  "Melee (Basic)": "ws",
  "Melee (Cavalry)": "ws",
  "Melee (Fencing)": "ws",
  "Melee (Parry)": "ws",
  "Melee (Polearm)": "ws",
  "Melee (Two-Handed)": "ws",
  "Ranged (Bow)": "bs",
  "Ranged (Crossbow)": "bs",
  "Ranged (Engineering)": "bs",
  "Ranged (Firearm)": "bs",
  "Ranged (Sling)": "bs",
  "Ranged (Throwing)": "bs",
  "Athletics": "s",
  "Climb": "s",
  "Endurance": "t",
  "Consume Alcohol": "t",
  "Drive": "ag",
  "Dodge": "ag",
  "Ride": "ag",
  "Stealth (Rural)": "ag",
  "Stealth (Urban)": "ag",
  "Cool": "wp",
  "Intimidate": "s",
  "Leadership": "fel",
  "Gossip": "fel",
  "Charm": "fel",
  "Animal Care": "int",
  "Gamble": "int",
  "Outdoor Survival": "int",
  "Perception": "i",
  "Intuition": "i",
  "Lore": "int",
  "Language": "int",
};

/**
 * Maps export skill ID patterns to WFRP4e skill "advanced" and "grouped" values.
 * @type {Record<string, {advanced: string, grouped: string}>}
 */
export const SKILL_CLASSIFICATION = {
  // Basic skills have advanced = ""
  // Advanced skills have advanced = "adv"
  // Grouped skills have grouped = "isSpec" or "noSpec"
};
