# WFRP 4e Character Importer - Component Model

## Module Structure

Each module has a single responsibility and exports focused functions.

### logger.js
- **Purpose**: Shared leveled logging with consistent prefixes and contextual data.
- **Exports**: `info`, `warn`, `error`, `debug`, `setDebugEnabled`, `createWarningContext`
- **Dependencies**: None (pure logging)
- **Pattern**: Console wrapper with module ID prefix. Warning context object for structured warnings.

### settings.js
- **Purpose**: Register and retrieve Foundry module settings.
- **Exports**: `registerSettings`, `getSetting`
- **Dependencies**: `logger.js` (for debug toggle)
- **Pattern**: Foundry `game.settings.register()` calls. Settings: debugLogging, createToken, showImportSummary.

### utilities.js
- **Purpose**: Pure helper functions with no Foundry dependencies (except deepClone/mergeObject wrappers).
- **Exports**: `isObject`, `isNonEmptyString`, `isNonNegativeNumber`, `isPositiveNumber`, `clamp`, `deepClone`, `mergeObject`, `speciesIdToName`, `capitalize`, `safeParseJson`, `formatBulletList`
- **Dependencies**: None logical (wraps foundry.utils)
- **Pattern**: Pure functions, early returns, no side effects.

### mappings.js
- **Purpose**: Centralized mapping tables — the ONLY module that knows Foundry property paths.
- **Exports**: `CHARACTERISTIC_MAP`, `CHARACTERISTIC_PATH`, `SPECIES_MAP`, `CAREER_LEVEL_MAP`, `ITEM_TYPE`, `MONEY_COIN_VALUE`, `MONEY_NAME_MAP`, `ACTOR_PATH`, `COMPENDIUM_PACKS`, `SKILL_CHARACTERISTIC_DEFAULTS`
- **Dependencies**: None
- **Pattern**: Named constants. Export JSON key -> Foundry system path mappings.

### jsonValidator.js
- **Purpose**: Validate export JSON before any Foundry documents are created.
- **Exports**: `validateCharacterJson`
- **Dependencies**: `utilities.js`
- **Pattern**: Returns `{ valid, errors[], warnings[] }`. Section validators for metadata, characteristics, skills, talents, career, experience, trappings, wealth, fate/resilience.

### compendiumLookup.js
- **Purpose**: Search WFRP4e compendiums for items by UUID, identifier, exact name, or case-insensitive name.
- **Exports**: `findItem`, `findItemByName`, `findItemByIdentifier`, `findItemByUuid`, `clearCache`
- **Dependencies**: `logger.js`, `mappings.js`
- **Pattern**: Priority chain: UUID > identifier > exact name > case-insensitive. Index caching. Warns on multiple matches.

### itemImporter.js
- **Purpose**: Import skills, talents, careers, trappings, weapons, armour, and money from export JSON.
- **Exports**: `importSkills`, `importTalents`, `importCareer`, `importTrappings`, `importMoney`, `createSummary`
- **Dependencies**: `logger.js`, `compendiumLookup.js`, `utilities.js`, `mappings.js`
- **Pattern**: Each import function returns array of item data objects for batch createEmbeddedDocuments. Custom item creation only when compendium match fails. Summary tracking throughout.

### actorBuilder.js
- **Purpose**: Create Foundry Actor and populate core system data (characteristics, details, status, experience).
- **Exports**: `buildBaseActorData`, `buildCharacteristicUpdates`, `buildDetailsUpdates`, `buildStatusUpdates`, `buildExperienceUpdates`, `buildMovementUpdate`, `createActor`, `configurePrototypeToken`
- **Dependencies**: `logger.js`, `utilities.js`, `mappings.js`
- **Pattern**: Separate builder functions for each data section. createActor() orchestrates: create empty actor -> update with merged section data.

### importer.js
- **Purpose**: Main import orchestrator following the 16-step sequence.
- **Exports**: `loadJsonFile`, `importCharacter`
- **Dependencies**: All other modules
- **Pattern**: Strict sequential steps. Validation before any Foundry docs. Batch embedded item creation. Summary dialog at end.

### main.js
- **Purpose**: Entry point — registers hooks, settings, and UI.
- **Exports**: None (hook-based)
- **Dependencies**: `logger.js`, `settings.js`, `importer.js`
- **Pattern**: Hooks.on("init"), Hooks.on("ready"), Hooks.on("renderActorDirectory"). File picker dialog -> loadJsonFile -> importCharacter.

## Data Flow

```
User selects JSON file
  -> main.js: showImportDialog()
  -> importer.js: loadJsonFile()
  -> jsonValidator.js: validateCharacterJson()
  -> [abort if errors]
  -> actorBuilder.js: createActor()
     -> buildCharacteristicUpdates(), buildDetailsUpdates(), etc.
     -> Actor.create() + Actor.update()
  -> itemImporter.js: importSkills(), importTalents(), importCareer(), importTrappings(), importMoney()
     -> compendiumLookup.js: findItem() for each
  -> Actor.createEmbeddedDocuments("Item", [...all items...])
  -> actorBuilder.js: configurePrototypeToken()
  -> importer.js: showImportSummary()
```
