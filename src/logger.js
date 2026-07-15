/**
 * Shared logger module for the WFRP 4e Character Importer.
 *
 * Provides leveled logging (info, warn, error, debug) with consistent
 * prefixes and contextual data (character name, object type, object name).
 *
 * @module logger
 */

const MODULE_ID = "wfrp4e-character-import";

const LOG_PREFIX = `[${MODULE_ID}]`;

/** @type {boolean} */
let debugEnabled = false;

/**
 * Enable or disable debug-level logging.
 *
 * @param {boolean} enabled - Whether debug logging is active.
 * @returns {void}
 */
export function setDebugEnabled(enabled) {
  debugEnabled = enabled;
}

/**
 * Log an informational message.
 *
 * @param {string} message - The message to log.
 * @returns {void}
 */
export function info(message) {
  console.log(`${LOG_PREFIX} ${message}`);
}

/**
 * Log a warning message with optional contextual data.
 *
 * @param {string} message - The warning message.
 * @param {object} [context] - Optional context: { characterName, objectType, objectName, reason }.
 * @returns {void}
 */
export function warn(message, context = {}) {
  const parts = [message];

  if (context.characterName) parts.push(`Character: "${context.characterName}"`);
  if (context.objectType) parts.push(`Type: ${context.objectType}`);
  if (context.objectName) parts.push(`Name: "${context.objectName}"`);
  if (context.reason) parts.push(`Reason: ${context.reason}`);

  console.warn(`${LOG_PREFIX} WARN: ${parts.join(" | ")}`);
}

/**
 * Log an error message.
 *
 * @param {string} message - The error message.
 * @param {Error|object} [error] - Optional error object for stack trace.
 * @returns {void}
 */
export function error(message, errorInstance = null) {
  if (errorInstance) {
    console.error(`${LOG_PREFIX} ERROR: ${message}`, errorInstance);
  } else {
    console.error(`${LOG_PREFIX} ERROR: ${message}`);
  }
}

/**
 * Log a debug message (only when debug mode is enabled).
 *
 * @param {string} message - The debug message.
 * @returns {void}
 */
export function debug(message) {
  if (debugEnabled) {
    console.debug(`${LOG_PREFIX} DEBUG: ${message}`);
  }
}

/**
 * Create a warning context object for consistent warning formatting.
 *
 * @param {string} characterName - Name of the character being imported.
 * @param {string} objectType - Type of the object (e.g. "Skill", "Talent").
 * @param {string} objectName - Name of the specific object.
 * @param {string} reason - Why the warning was triggered.
 * @returns {object} Context object for warn().
 */
export function createWarningContext(characterName, objectType, objectName, reason) {
  return { characterName, objectType, objectName, reason };
}
