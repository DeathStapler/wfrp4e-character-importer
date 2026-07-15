# WFRP 4e Character Importer

A Foundry VTT module that imports characters created by the [WFRP 4e Character Creator](https://github.com/ray/wfrp4e-character-creator) web application into the WFRP 4e game system on Foundry VTT.

## Overview

This module translates a stable JSON schema (owned by the web application) into Foundry actor data. All Foundry and WFRP4e implementation details are isolated within this module, so changes to the game system do not require changes to the web application.

## Requirements

- **Foundry VTT** v13 or v14
- **WFRP 4e System** v9.0+ (with core compendiums installed)

## Installation

1. Install the WFRP 4e system from Foundry's system installer.
2. In Foundry, go to **Add-on Modules > Install Module**.
3. Paste the manifest URL: `https://github.com/DeathStapler/wfrp4e-character-importer/releases/latest/download/module.json`
4. Enable the module in your world.

## Usage

1. In the **Actors** tab, click the **Import Character** button.
2. Select a JSON export file from the WFRP 4e Character Creator.
3. The module validates, imports, and creates the character.
4. An import summary dialog appears showing what was imported.

## Architecture

```
src/
    main.js              - Entry point: hooks, UI, file dialog
    importer.js          - Main import orchestrator (16-step sequence)
    actorBuilder.js      - Actor creation and core data population
    itemImporter.js      - Skills, talents, careers, trappings, money
    compendiumLookup.js  - Compendium search (UUID > ID > name)
    jsonValidator.js     - Schema validation before any Foundry docs
    mappings.js          - Centralized Foundry property path mappings
    logger.js            - Shared leveled logger
    settings.js          - Module settings registration
    utilities.js         - Pure helper functions
```

## Import Process

The importer follows a strict 16-step sequence:

1. Load JSON file
2. Validate schema
3. Report validation errors
4. Create Actor
5. Populate core actor fields
6. Import Characteristics
7. Import Skills
8. Import Talents
9. Import Careers
10. Import Trappings
11. Import Weapons
12. Import Armor
13. Import Money
14. Import Active Effects
15. Configure Prototype Token
16. Produce import summary

## Compendium Matching

Items are matched from compendiums using this priority:

1. UUID
2. Internal identifier (`flags.wfrp4e.id`)
3. Exact name
4. Case-insensitive name

Custom items are only created when no compendium match exists.

## Settings

- **Debug Logging** — Enable detailed console debug output.
- **Create Prototype Token** — Auto-configure a token for imported characters.
- **Show Import Summary** — Display a summary dialog after import.

## JSON Schema

See `docs/example_export.json` for a sample export file.

## License

MIT
