/**
 * Compendium lookup module for the WFRP 4e Character Importer.
 *
 * Searches official WFRP4e compendiums for items by UUID, identifier,
 * exact name, or case-insensitive name. Returns found items or null.
 *
 * Matching priority:
 * 1. UUID
 * 2. Internal identifier (flags.wfrp4e.id)
 * 3. Exact name
 * 4. Case-insensitive name
 *
 * @module compendiumLookup
 */

import { info, warn, debug } from "./logger.js";
import { COMPENDIUM_PACKS } from "./mappings.js";

/**
 * Cache of loaded compendium indices to avoid repeated lookups.
 * @type {Map<string, object[]>}
 */
const indexCache = new Map();

/**
 * Get all loaded WFRP4e compendium packs.
 *
 * @returns {CompendiumCollection[]} Array of compendium collections.
 */
function getWfrpPacks() {
  return game.packs.filter((pack) => {
    return COMPENDIUM_PACKS.includes(pack.collection) || pack.metadata.system === "wfrp4e";
  });
}

/**
 * Load and cache the index for a compendium pack.
 *
 * @param {CompendiumCollection} pack - The compendium pack.
 * @returns {Promise<object[]>} The pack index entries.
 */
async function getPackIndex(pack) {
  const collection = pack.collection;

  if (indexCache.has(collection)) {
    return indexCache.get(collection);
  }

  const index = await pack.getIndex({ fields: ["type", "flags"] });
  const entries = [...index];
  indexCache.set(collection, entries);
  return entries;
}

/**
 * Search all WFRP4e compendiums for an item by name.
 *
 * Tries exact name match first, then case-insensitive.
 * Warns when multiple matches exist.
 *
 * @param {string} name - The item name to search for.
 * @param {string} [itemType] - Optional item type filter (e.g. "skill", "talent").
 * @param {string} [characterName] - Character name for warning context.
 * @returns {Promise<Item|null>} The found Item document, or null.
 */
export async function findItemByName(name, itemType = null, characterName = "") {
  if (!name) return null;

  const packs = getWfrpPacks();
  const matches = [];

  for (const pack of packs) {
    const index = await getPackIndex(pack);

    for (const entry of index) {
      if (entry.name === name) {
        if (itemType && entry.type !== itemType) continue;
        const item = await pack.getDocument(entry._id);
        matches.push(item);
      }
    }
  }

  if (matches.length === 0) {
    // Try case-insensitive
    const lowerName = name.toLowerCase();
    for (const pack of packs) {
      const index = await getPackIndex(pack);

      for (const entry of index) {
        if (entry.name?.toLowerCase() === lowerName) {
          if (itemType && entry.type !== itemType) continue;
          const item = await pack.getDocument(entry._id);
          matches.push(item);
        }
      }
    }
  }

  if (matches.length > 1) {
    warn(`Multiple compendium matches found for "${name}"`, {
      characterName,
      objectType: itemType ?? "Item",
      objectName: name,
      reason: `${matches.length} matches found, using first.`,
    });
  }

  if (matches.length > 0) {
    debug(`Found compendium item "${name}" (type: ${matches[0].type})`);
    return matches[0];
  }

  return null;
}

/**
 * Search compendiums for an item by its WFRP4e internal identifier.
 *
 * @param {string} identifier - The internal identifier (stored in flags.wfrp4e.id).
 * @param {string} [itemType] - Optional item type filter.
 * @param {string} [characterName] - Character name for warning context.
 * @returns {Promise<Item|null>} The found Item document, or null.
 */
export async function findItemByIdentifier(identifier, itemType = null, characterName = "") {
  if (!identifier) return null;

  const packs = getWfrpPacks();

  for (const pack of packs) {
    const index = await getPackIndex(pack);

    for (const entry of index) {
      const flagId = entry.flags?.wfrp4e?.id;

      if (flagId === identifier) {
        if (itemType && entry.type !== itemType) continue;
        const item = await pack.getDocument(entry._id);
        debug(`Found compendium item by identifier "${identifier}"`);
        return item;
      }
    }
  }

  return null;
}

/**
 * Search compendiums for an item by UUID.
 *
 * @param {string} uuid - The Foundry UUID.
 * @returns {Promise<Item|null>} The found Item document, or null.
 */
export async function findItemByUuid(uuid) {
  if (!uuid) return null;

  try {
    const document = await fromUuid(uuid);
    if (document) {
      debug(`Found compendium item by UUID "${uuid}"`);
      return document;
    }
  } catch (err) {
    debug(`UUID lookup failed for "${uuid}": ${err.message}`);
  }

  return null;
}

/**
 * Find an item in compendiums using the full matching priority.
 *
 * Priority: UUID > internal identifier > exact name > case-insensitive name.
 *
 * @param {object} options - Search options.
 * @param {string} [options.uuid] - UUID to search for.
 * @param {string} [options.identifier] - Internal identifier to search for.
 * @param {string} [options.name] - Name to search for.
 * @param {string} [options.itemType] - Item type filter.
 * @param {string} [options.characterName] - Character name for warnings.
 * @returns {Promise<Item|null>} The found Item document, or null.
 */
export async function findItem(options = {}) {
  const { uuid, identifier, name, itemType, characterName } = options;

  // 1. UUID
  if (uuid) {
    const item = await findItemByUuid(uuid);
    if (item) return item;
  }

  // 2. Internal identifier
  if (identifier) {
    const item = await findItemByIdentifier(identifier, itemType, characterName);
    if (item) return item;
  }

  // 3 & 4. Exact name, then case-insensitive
  if (name) {
    const item = await findItemByName(name, itemType, characterName);
    if (item) return item;
  }

  return null;
}

/**
 * Clear the compendium index cache.
 * Useful if compendiums are updated during a session.
 *
 * @returns {void}
 */
export function clearCache() {
  indexCache.clear();
  info("Compendium cache cleared.");
}
