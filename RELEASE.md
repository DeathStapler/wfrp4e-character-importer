# Release Process

Releases are fully automated via GitHub Actions (`.github/workflows/release.yml`).

## How to Release a New Version

```bash
git tag v1.0.2
git push origin v1.0.2
```

That's it. The workflow handles the rest.

## What the Workflow Does

1. **Injects the version** from the tag into `module.json` (e.g. `v1.0.2` → `1.0.2`)
2. **Sets the download URL** to the versioned release asset
3. **Builds `module.zip`** containing only module files (`module.json`, `src/`, `styles/`, `README.md`, `LICENSE`)
4. **Creates the GitHub release** and uploads `module.zip` and `module.json` as assets

## How Foundry Detects Updates

Foundry reads the `manifest` URL from `module.json`:

```
https://github.com/DeathStapler/wfrp4e-character-importer/releases/latest/download/module.json
```

This always serves the latest release's `module.json`, which contains the current `version` and `download` fields. When Foundry sees a higher version than what's installed, it offers an in-app update — no uninstall/reinstall needed.

## Key URLs

| Purpose  | URL |
|----------|-----|
| Manifest | `https://github.com/DeathStapler/wfrp4e-character-importer/releases/latest/download/module.json` |
| Download | `https://github.com/DeathStapler/wfrp4e-character-importer/releases/download/v{VERSION}/module.zip` |

## Notes

- The `version` field in the local `module.json` does not need to be manually updated — the workflow injects it from the tag at build time.
- Tags must follow the `v{VERSION}` pattern (e.g. `v1.0.0`, `v1.1.0`, `v2.0.0`).
- The workflow requires `contents: write` permission (already configured).
