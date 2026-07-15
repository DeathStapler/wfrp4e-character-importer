/**
 * Module settings for the WFRP 4e Character Importer.
 *
 * Registers Foundry settings that control importer behavior.
 *
 * @module settings
 */

import { setDebugEnabled } from "./logger.js";

const MODULE_ID = "wfrp4e-character-import";

/** @typedef {"info"|"warn"|"error"|"debug"} LogLevel */

/**
 * Register all module settings on Foundry init.
 *
 * @returns {void}
 */
export function registerSettings() {
  game.settings.register(MODULE_ID, "debugLogging", {
    name: "Debug Logging",
    hint: "Enable detailed debug logging in the browser console.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => setDebugEnabled(value),
  });

  game.settings.register(MODULE_ID, "createToken", {
    name: "Create Prototype Token",
    hint: "Automatically configure a prototype token for imported characters.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "showImportSummary", {
    name: "Show Import Summary",
    hint: "Display a summary dialog after a successful import.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });
}

/**
 * Get a module setting value.
 *
 * @param {string} key - The setting key.
 * @returns {*} The setting value.
 */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}
