# Importer Module Rule

## When creating or modifying importer modules:

1. **Single responsibility**: Each module handles one concern only.
2. **No scattered mappings**: All Foundry property paths must come from `mappings.js`.
3. **Validation first**: Always validate JSON before creating any Foundry documents.
4. **Compendium priority**: UUID > identifier > exact name > case-insensitive name. Custom items only as fallback.
5. **Batch creation**: Use `createEmbeddedDocuments("Item", [...])` for all items at once.
6. **Recover when possible**: Warn and continue for missing items. Only abort for missing required actor data.
7. **Structured warnings**: Use `createWarningContext()` with character name, object type, object name, and reason.
8. **Strict sequence**: Follow the 16-step import process in order.
9. **JSDoc on exports**: Every exported function needs purpose, parameters, returns, and throws.
10. **No magic strings**: Use named constants from mappings or utilities.
