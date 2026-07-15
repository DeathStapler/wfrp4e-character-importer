/**
 * Utility functions for the WFRP 4e Character Importer.
 *
 * Pure helper functions with no Foundry dependencies.
 *
 * @module utilities
 */

/**
 * Check whether a value is a non-null object (not an array).
 *
 * @param {*} value - The value to check.
 * @returns {boolean} True if value is a plain object.
 */
export function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check whether a value is a non-empty string.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} True if value is a non-empty string.
 */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check whether a value is a finite non-negative number.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} True if value is a finite number >= 0.
 */
export function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Check whether a value is a finite positive number.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} True if value is a finite number > 0.
 */
export function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Clamp a number to a valid range.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Deep clone an object using structured cloning.
 *
 * @param {*} obj - The object to clone.
 * @returns {*} A deep copy of the object.
 */
export function deepClone(obj) {
  return foundry.utils.deepClone(obj);
}

/**
 * Merge objects deeply, combining properties of source into target.
 *
 * @param {object} target - The target object.
 * @param {...object} sources - Source objects to merge into target.
 * @returns {object} The merged object.
 */
export function mergeObject(target, ...sources) {
  return foundry.utils.mergeObject(target, ...sources);
}

/**
 * Convert a species ID from the export JSON to the WFRP4e display name.
 *
 * @param {string} speciesId - The species ID (e.g. "human", "dwarf").
 * @returns {string} The species display name, or the ID if not found.
 */
export function speciesIdToName(speciesId) {
  const config = game?.wfrp4e?.config;
  if (!config?.species?.[speciesId]) return speciesId;
  return config.species[speciesId];
}

/**
 * Capitalize the first letter of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
export function capitalize(str) {
  if (!isNonEmptyString(str)) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Safely parse JSON, returning null on failure.
 *
 * @param {string} jsonText - The JSON string to parse.
 * @returns {object|null} The parsed object, or null if parsing fails.
 */
export function safeParseJson(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

/**
 * Format a list of strings as a bullet-separated string.
 *
 * @param {string[]} items - The items to format.
 * @returns {string} The formatted string.
 */
export function formatBulletList(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items.map((item) => `- ${item}`).join("\n");
}
