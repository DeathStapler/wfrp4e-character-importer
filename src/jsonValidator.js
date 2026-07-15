/**
 * JSON schema validation for the WFRP 4e Character Importer.
 *
 * Validates the external Character Creator export JSON before any
 * Foundry documents are created. Returns a structured result with
 * errors and warnings.
 *
 * @module jsonValidator
 */

import { isObject, isNonEmptyString, isNonNegativeNumber, isPositiveNumber } from "./utilities.js";

/**
 * Validation result.
 *
 * @typedef {object} ValidationResult
 * @property {boolean} valid - True if no errors (warnings may still exist).
 * @property {string[]} errors - Fatal errors that should abort import.
 * @property {string[]} warnings - Non-fatal issues to report to the user.
 */

/**
 * Create an empty validation result.
 *
 * @returns {ValidationResult}
 */
function createResult() {
  return { valid: true, errors: [], warnings: [] };
}

/**
 * Add an error to the result.
 *
 * @param {ValidationResult} result - The result to modify.
 * @param {string} message - The error message.
 * @returns {void}
 */
function addError(result, message) {
  result.errors.push(message);
  result.valid = false;
}

/**
 * Add a warning to the result.
 *
 * @param {ValidationResult} result - The result to modify.
 * @param {string} message - The warning message.
 * @returns {void}
 */
function addWarning(result, message) {
  result.warnings.push(message);
}

/**
 * Validate the metadata section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateMetadata(data, result) {
  if (!isObject(data.metadata)) {
    addError(result, "Missing 'metadata' object.");
    return;
  }

  const { metadata } = data;

  if (!isNonEmptyString(metadata.name)) {
    addError(result, "metadata.name is required and must be a non-empty string.");
  }

  if (!isNonEmptyString(metadata.speciesId)) {
    addError(result, "metadata.speciesId is required and must be a non-empty string.");
  }
}

/**
 * Validate the characteristics section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateCharacteristics(data, result) {
  if (!isObject(data.characteristicBases)) {
    addError(result, "Missing 'characteristicBases' object.");
  } else {
    const requiredKeys = ["WS", "BS", "S", "T", "I", "Ag", "Dex", "Int", "WP", "Fel"];
    for (const key of requiredKeys) {
      if (!isNonNegativeNumber(data.characteristicBases[key])) {
        addError(result, `characteristicBases.${key} must be a non-negative number.`);
      }
    }
  }

  if (!isObject(data.characteristicAdvances)) {
    addWarning(result, "Missing 'characteristicAdvances' object — defaulting to 0 advances.");
  }
}

/**
 * Validate the skills section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateSkills(data, result) {
  if (!Array.isArray(data.skills)) {
    addWarning(result, "Missing 'skills' array — no skills will be imported.");
    return;
  }

  data.skills.forEach((skill, index) => {
    if (!isObject(skill)) {
      addWarning(result, `skills[${index}] is not an object — skipping.`);
      return;
    }
    if (!isNonEmptyString(skill.name)) {
      addWarning(result, `skills[${index}].name is required — skipping.`);
    }
    if (!isNonNegativeNumber(skill.advances)) {
      addWarning(result, `skills[${index}].advances is invalid — will be clamped to 0.`);
    }
  });
}

/**
 * Validate the talents section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateTalents(data, result) {
  if (!Array.isArray(data.talents)) {
    addWarning(result, "Missing 'talents' array — no talents will be imported.");
    return;
  }

  data.talents.forEach((talent, index) => {
    if (!isObject(talent)) {
      addWarning(result, `talents[${index}] is not an object — skipping.`);
      return;
    }
    if (!isNonEmptyString(talent.name)) {
      addWarning(result, `talents[${index}].name is required — skipping.`);
    }
  });
}

/**
 * Validate the career section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateCareer(data, result) {
  if (!isNonEmptyString(data.currentCareerId)) {
    addWarning(result, "Missing 'currentCareerId' — no career will be imported.");
  }

  if (data.currentCareerLevel != null && !isPositiveNumber(data.currentCareerLevel)) {
    addWarning(result, "'currentCareerLevel' should be a positive number — defaulting to 1.");
  }
}

/**
 * Validate the experience section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateExperience(data, result) {
  if (!isObject(data.experience)) {
    addWarning(result, "Missing 'experience' object — defaulting to 0.");
    return;
  }

  if (!isNonNegativeNumber(data.experience.total)) {
    addWarning(result, "experience.total must be a non-negative number — defaulting to 0.");
  }
  if (!isNonNegativeNumber(data.experience.spent)) {
    addWarning(result, "experience.spent must be a non-negative number — defaulting to 0.");
  }
}

/**
 * Validate the trappings section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateTrappings(data, result) {
  if (!Array.isArray(data.trappings)) {
    addWarning(result, "Missing 'trappings' array — no trappings will be imported.");
    return;
  }

  data.trappings.forEach((trapping, index) => {
    if (!isObject(trapping)) {
      addWarning(result, `trappings[${index}] is not an object — skipping.`);
      return;
    }
    if (!isNonEmptyString(trapping.name)) {
      addWarning(result, `trappings[${index}].name is required — skipping.`);
    }
  });
}

/**
 * Validate the wealth section of the export JSON.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateWealth(data, result) {
  if (!isObject(data.wealth)) {
    addWarning(result, "Missing 'wealth' object — no money will be imported.");
    return;
  }

  const { wealth } = data;
  for (const key of ["gold", "silver", "brass"]) {
    if (wealth[key] != null && !isNonNegativeNumber(wealth[key])) {
      addWarning(result, `wealth.${key} must be a non-negative number — defaulting to 0.`);
    }
  }
}

/**
 * Validate the fate and resilience sections.
 *
 * @param {object} data - The full export data.
 * @param {ValidationResult} result - The result to update.
 * @returns {void}
 */
function validateFateAndResilience(data, result) {
  if (isObject(data.fate)) {
    if (!isNonNegativeNumber(data.fate.total)) {
      addWarning(result, "fate.total must be a non-negative number — defaulting to 0.");
    }
  } else {
    addWarning(result, "Missing 'fate' object — defaulting to 0.");
  }

  if (isObject(data.resilience)) {
    if (!isNonNegativeNumber(data.resilience.total)) {
      addWarning(result, "resilience.total must be a non-negative number — defaulting to 0.");
    }
  } else {
    addWarning(result, "Missing 'resilience' object — defaulting to 0.");
  }
}

/**
 * Validate the full export JSON data.
 *
 * Performs all validation checks and returns a structured result.
 * Call this before creating any Foundry documents.
 *
 * @param {object} data - The parsed export JSON data.
 * @returns {ValidationResult} The validation result with errors and warnings.
 */
export function validateCharacterJson(data) {
  const result = createResult();

  if (!isObject(data)) {
    addError(result, "Export data must be a JSON object.");
    return result;
  }

  validateMetadata(data, result);
  validateCharacteristics(data, result);
  validateSkills(data, result);
  validateTalents(data, result);
  validateCareer(data, result);
  validateExperience(data, result);
  validateTrappings(data, result);
  validateWealth(data, result);
  validateFateAndResilience(data, result);

  return result;
}
