/**
 * Main import orchestrator for the WFRP 4e Character Importer.
 *
 * Follows the import sequence defined in the project instructions:
 * 1. Load JSON file
 * 2. Validate schema
 * 3. Report validation errors
 * 4. Create Actor
 * 5. Populate core actor fields
 * 6. Import Characteristics
 * 7. Import Skills
 * 8. Import Talents
 * 9. Import Careers
 * 10. Import Trappings
 * 11. Import Weapons
 * 12. Import Armor
 * 13. Import Money
 * 14. Import Active Effects
 * 15. Configure Prototype Token
 * 16. Produce an import summary
 *
 * @module importer
 */

import { info, warn, error, debug } from "./logger.js";
import { validateCharacterJson } from "./jsonValidator.js";
import { createActor, configurePrototypeToken } from "./actorBuilder.js";
import {
  importSkills,
  importTalents,
  importCareer,
  importTrappings,
  importMoney,
  createSummary,
  applyPendingAdvances,
} from "./itemImporter.js";
import { getSetting } from "./settings.js";

/**
 * Import result.
 *
 * @typedef {object} ImportResult
 * @property {boolean} success - Whether the import completed without fatal errors.
 * @property {Actor|null} actor - The created actor, or null on failure.
 * @property {ImportSummary} summary - The import summary.
 * @property {string[]} errors - Fatal error messages.
 */

/**
 * Load and parse a JSON file from a File object.
 *
 * @param {File} file - The file to load.
 * @returns {Promise<object>} The parsed JSON data.
 * @throws {Error} If the file cannot be read or parsed.
 */
export async function loadJsonFile(file) {
  const text = await file.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${err.message}`);
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("JSON root must be an object.");
  }

  return data;
}

/**
 * Report validation errors to the user via a Foundry dialog.
 *
 * @param {string[]} errors - Fatal error messages.
 * @param {string[]} warnings - Non-fatal warning messages.
 * @returns {Promise<void>}
 */
async function reportValidationErrors(errors, warnings) {
  const errorHtml = errors.map((e) => `<li>${e}</li>`).join("");
  const warningHtml = warnings.map((w) => `<li>${w}</li>`).join("");

  const content = `
    <div class="wfrp4e-import-validation-errors">
      ${errors.length > 0 ? `<h3>Errors</h3><ul class="error-list">${errorHtml}</ul>` : ""}
      ${warnings.length > 0 ? `<h3>Warnings</h3><ul class="warning-list">${warningHtml}</ul>` : ""}
    </div>
  `;

  await foundry.applications.api.DialogV2.prompt({
    window: { title: "Import Validation Errors" },
    content,
    ok: {
      icon: "fas fa-check",
      label: "OK",
    },
  });
}

/**
 * Display the import summary dialog.
 *
 * @param {Actor} actor - The created actor.
 * @param {ImportSummary} summary - The import summary.
 * @returns {Promise<void>}
 */
async function showImportSummary(actor, summary) {
  const lines = [
    `<h2>Import Summary: ${actor.name}</h2>`,
    `<p><strong>Actor ID:</strong> ${actor.id}</p>`,
    "<hr/>",
    "<table>",
    `<tr><td>Skills imported (compendium)</td><td>${summary.skillsImported}</td></tr>`,
    `<tr><td>Skills created (custom)</td><td>${summary.skillsCreated}</td></tr>`,
    `<tr><td>Skills skipped</td><td>${summary.skillsSkipped}</td></tr>`,
    `<tr><td>Talents imported (compendium)</td><td>${summary.talentsImported}</td></tr>`,
    `<tr><td>Talents created (custom)</td><td>${summary.talentsCreated}</td></tr>`,
    `<tr><td>Talents skipped</td><td>${summary.talentsSkipped}</td></tr>`,
    `<tr><td>Careers imported</td><td>${summary.careersImported}</td></tr>`,
    `<tr><td>Careers skipped</td><td>${summary.careersSkipped}</td></tr>`,
    `<tr><td>Trappings imported (compendium)</td><td>${summary.trappingsImported}</td></tr>`,
    `<tr><td>Trappings created (custom)</td><td>${summary.trappingsCreated}</td></tr>`,
    `<tr><td>Trappings skipped</td><td>${summary.trappingsSkipped}</td></tr>`,
    `<tr><td>Weapons imported</td><td>${summary.weaponsImported}</td></tr>`,
    `<tr><td>Armour imported</td><td>${summary.armourImported}</td></tr>`,
    `<tr><td>Money imported</td><td>${summary.moneyImported}</td></tr>`,
  ];

  if (summary.warnings.length > 0) {
    lines.push("</table><hr/><h3>Warnings</h3><ul>");
    for (const w of summary.warnings) {
      lines.push(`<li>${w}</li>`);
    }
    lines.push("</ul>");
  } else {
    lines.push("</table>");
  }

  await foundry.applications.api.DialogV2.prompt({
    window: { title: "Import Complete" },
    content: lines.join(""),
    ok: {
      icon: "fas fa-check",
      label: "OK",
    },
  });
}

/**
 * Run the full import process from parsed JSON data.
 *
 * Follows the import sequence strictly in order.
 *
 * @param {object} data - The parsed export JSON data.
 * @returns {Promise<ImportResult>} The import result.
 */
export async function importCharacter(data) {
  const summary = createSummary();
  const errors = [];

  // Step 2: Validate schema
  debug("Step 2: Validating JSON schema...");
  const validation = validateCharacterJson(data);

  // Step 3: Report validation errors
  if (validation.errors.length > 0) {
    debug("Step 3: Reporting validation errors...");
    await reportValidationErrors(validation.errors, validation.warnings);
    return { success: false, actor: null, summary, errors: validation.errors };
  }

  // Log warnings but continue
  for (const w of validation.warnings) {
    warn(w);
    summary.warnings.push(w);
  }

  const characterName = data.metadata?.name ?? "Unknown";

  try {
    // Step 4 & 5: Create Actor and populate core fields
    debug("Step 4-5: Creating actor and populating core fields...");
    const actor = await createActor(data);

    // Step 6: Import Characteristics (already done in createActor via buildCharacteristicUpdates)
    debug("Step 6: Characteristics populated.");

    // Step 7: Import Skills
    debug("Step 7: Importing skills...");
    const skillItems = await importSkills(data.skills, characterName, summary);

    // Step 8: Import Talents
    debug("Step 8: Importing talents...");
    const talentItems = await importTalents(data.talents, characterName, summary);

    // Step 9: Import Careers
    debug("Step 9: Importing career...");
    const careerItem = await importCareer(
      data.currentCareerId,
      data.currentCareerLevel,
      characterName,
      summary,
    );

    // Step 10: Import Trappings (includes weapons and armour)
    debug("Step 10: Importing trappings...");
    const trappingItems = await importTrappings(data.trappings, characterName, summary);

    // Step 11-12: Weapons and Armour are included in trappings
    debug("Step 11-12: Weapons and armour included in trappings.");

    // Step 13: Import Money
    debug("Step 13: Importing money...");
    const moneyItems = await importMoney(data.wealth, summary);

    // Batch create all embedded items
    const allItems = [...skillItems, ...talentItems];
    if (careerItem) allItems.push(careerItem);
    allItems.push(...trappingItems, ...moneyItems);

    let createdItems = [];
    if (allItems.length > 0) {
      debug(`Creating ${allItems.length} embedded items...`);
      createdItems = await actor.createEmbeddedDocuments("Item", allItems);
    }

    if (createdItems.length > 0) {
      debug(`Applying pending advances to ${createdItems.length} embedded item(s)...`);
      await applyPendingAdvances(actor, createdItems);
    }

    // Step 14: Import Active Effects (future: apply any active effects from export)
    debug("Step 14: No active effects to import (not yet supported in export format).");

    // Step 15: Configure Prototype Token
    if (getSetting("createToken")) {
      debug("Step 15: Configuring prototype token...");
      await configurePrototypeToken(actor);
    }

    // Step 16: Produce import summary
    debug("Step 16: Producing import summary...");
    info(`Import complete for "${actor.name}".`);

    if (getSetting("showImportSummary")) {
      await showImportSummary(actor, summary);
    }

    return { success: true, actor, summary, errors: [] };
  } catch (err) {
    error(`Import failed for "${characterName}": ${err.message}`, err);
    return { success: false, actor: null, summary, errors: [err.message] };
  }
}
