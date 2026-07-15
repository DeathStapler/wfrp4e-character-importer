/**
 * Entry point for the WFRP 4e Character Importer module.
 *
 * Registers Foundry hooks, settings, and the import button/dialog UI.
 *
 * @module main
 */

import { info, debug, setDebugEnabled } from "./logger.js";
import { registerSettings, getSetting } from "./settings.js";
import { loadJsonFile, importCharacter } from "./importer.js";

const MODULE_ID = "wfrp4e-character-import";

/**
 * Show the import dialog with a file picker.
 *
 * @returns {Promise<void>}
 */
async function showImportDialog() {
  const content = `
    <div class="wfrp4e-import-dialog">
      <p>Select a WFRP 4e Character Creator export JSON file to import.</p>
      <div class="form-group">
        <label>Character JSON File</label>
        <input type="file" id="wfrp4e-import-file" accept=".json" />
      </div>
    </div>
  `;

  await Dialog.wait({
    title: "Import WFRP 4e Character",
    content,
    buttons: {
      import: {
        icon: '<i class="fas fa-file-import"></i>',
        label: "Import",
        callback: async (html) => {
          const fileInput = html[0].querySelector("#wfrp4e-import-file");
          const file = fileInput?.files?.[0];

          if (!file) {
            ui.notifications.warn("Please select a JSON file to import.");
            return;
          }

          ui.notifications.info(`Importing "${file.name}"...`);

          try {
            const data = await loadJsonFile(file);
            const result = await importCharacter(data);

            if (result.success) {
              ui.notifications.info(
                `Character "${result.actor.name}" imported successfully!`,
              );
            } else {
              ui.notifications.error(
                `Import failed: ${result.errors.join("; ")}`,
              );
            }
          } catch (err) {
            ui.notifications.error(`Import error: ${err.message}`);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "import",
  });
}

/**
 * Initialize the module on Foundry 'init' hook.
 */
Hooks.on("init", () => {
  debug("Initializing WFRP 4e Character Importer...");
  registerSettings();
});

/**
 * Set up the module on Foundry 'ready' hook.
 */
Hooks.on("ready", () => {
  // Apply debug setting
  setDebugEnabled(getSetting("debugLogging"));

  info("WFRP 4e Character Importer ready.");

  // Register the scene control button
  Hooks.on("getActorDirectoryEntryContext", (html, entries) => {
    // Future: right-click context menu on actor directory
  });
});

/**
 * Add an import button to the Actor directory sidebar.
 */
Hooks.on("renderActorDirectory", (app, html) => {
  const importButton = $(
    `<a class="wfrp4e-import-button" title="Import WFRP 4e Character">
      <i class="fas fa-file-import"></i> Import Character
    </a>`,
  );

  importButton.on("click", (event) => {
    event.preventDefault();
    showImportDialog();
  });

  const footer = html.find(".directory-footer");
  if (footer.length) {
    footer.append(importButton);
  } else {
    html.find(".header-actions").append(importButton);
  }
});
