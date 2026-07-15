---
trigger: always_on
---

# WFRP 4e Character Importer – GitHub Copilot Instructions

## Project Overview

This project is a Foundry VTT module that imports characters created by an external web-based WFRP 4e Character Creator into the WFRP 4e game system.

The importer should **not** rely on Foundry export JSON as the interchange format. Instead, the web application owns a stable JSON schema, and this module translates that schema into Foundry actor data.

The goal is to isolate Foundry and WFRP4e implementation details inside this module so that changes to the game system do not require changes to the web application.

---

# Development Goals

When generating code:

* Prefer readability over cleverness.
* Write modular, reusable code.
* Use modern JavaScript (ES2022+).
* Use async/await instead of Promise chains.
* Avoid duplicate logic.
* Include JSDoc comments for exported functions.
* Validate incoming data before creating Foundry documents.
* Produce meaningful error messages.
* Never silently ignore invalid data.

---

# Architecture

Organize the project into small modules.

Suggested layout:

```
src/
    importer.js
    actorBuilder.js
    itemImporter.js
    compendiumLookup.js
    jsonValidator.js
    logger.js
    settings.js
    utilities.js
```

Each module should have a single responsibility.

---

# Import Process

The importer should follow this sequence.

1. Load JSON file.
2. Validate schema.
3. Report validation errors.
4. Create Actor.
5. Populate core actor fields.
6. Import Characteristics.
7. Import Skills.
8. Import Talents.
9. Import Careers.
10. Import Trappings.
11. Import Weapons.
12. Import Armor.
13. Import Money.
14. Import Active Effects.
15. Configure Prototype Token.
16. Produce an import summary.

Never perform steps out of order.

---

# JSON Philosophy

The external JSON is the source of truth.

The importer performs all translation into Foundry's internal format.

Do not expose Foundry-specific field names in the external schema.

Avoid storing Foundry IDs in exported JSON.

---

# Compendium Usage

Whenever possible:

* Search official WFRP compendiums.
* Duplicate existing Items from compendiums.
* Only create custom Items when no match exists.

Matching priority:

1. UUID
2. Internal identifier
3. Exact name
4. Case-insensitive name

Warn when multiple matches exist.

---

# Error Handling

Recover whenever possible.

Examples:

* Missing Talent

  * Warn user.
  * Continue import.

* Missing Career

  * Warn user.
  * Continue import.

* Invalid Skill Advance

  * Clamp to valid values.
  * Log warning.

Only abort when required actor data is missing.

---

# Logging

All logging should use a shared logger.

Levels:

* info
* warn
* error
* debug

Every warning should include:

* character name
* object type
* object name
* reason

---

# Validation

Create a validator that checks:

Required fields

Character

Characteristics

Skills

Talents

Career

Species

Experience

Items

Validate before creating any Foundry documents.

---

# Data Mapping

Never scatter field mappings throughout the code.

Maintain centralized mapping tables.

Example:

```
Strength -> system.characteristics.s
Weapon Skill -> system.characteristics.ws
Ballistic Skill -> system.characteristics.bs
```

Mapping tables should be the only place that knows Foundry property paths.

---

# Actor Creation

Prefer:

1. Create empty Actor.
2. Populate actor system data.
3. Create embedded Items.
4. Apply Active Effects.

Avoid building one massive update object.

---

# Embedded Documents

Batch creation whenever possible.

Examples:

```
createEmbeddedDocuments("Item", [...])
```

instead of repeated individual creates.

---

# Future Compatibility

Assume WFRP4e data structures may change.

Keep Foundry-specific logic isolated.

Avoid hardcoded property paths outside mapping modules.

---

# Coding Style

Prefer:

Early returns.

Small functions.

Pure helper functions.

Named constants.

Avoid:

Nested conditionals.

Magic strings.

Repeated property paths.

---

# Testing

Every new feature should include:

* valid import test
* missing data test
* malformed JSON test
* duplicate item test
* missing compendium item test

---

# Documentation

Every exported function should include:

Purpose

Parameters

Returns

Throws

Examples when appropriate.

---

# Copilot Guidance

When generating code:

* Follow existing project architecture.
* Reuse utility functions before creating new ones.
* Prefer composition over inheritance.
* Avoid introducing unnecessary dependencies.
* Keep functions focused on a single responsibility.
* Generate code that is easy to debug.
* Assume maintainability is more important than minimizing lines of code.
* If the WFRP4e API provides an official method for creating or updating Actors or Items, prefer that method over directly manipulating internal data structures.

# Documentation

Foundry VTT API documentation is available at https://foundryvtt.com/api/
WFRP4e repository source code is available at https://github.com/moo-man/WFRP4e-FoundryVTT
JSON export file sample is available at docs/example_export.json
