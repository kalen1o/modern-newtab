# Biome Setup Guide

Biome is the primary linting and formatting toolchain for this monorepo, providing fast and cohesive code quality for JavaScript, TypeScript, JSX, TSX, JSON, CSS, and GraphQL.

## Migration from ESLint

ESLint has been removed from this project in favor of Biome.

### What Was Migrated

- Removed `@nx/eslint` from root `package.json`
- Removed `eslint.config.js` files from all frontend apps
- Removed `lint` targets from all `project.json` files
- Updated all lint scripts to use Biome (`biome check .`)
- Biome configuration covers all previously used rules (React, TypeScript, style, correctness)

### Current State

The monorepo now uses Biome as the exclusive linting and formatting tool. All ESLint dependencies and configurations have been removed.

Biome replaces ESLint and Prettier in this monorepo, offering:
- **10-20x faster** than ESLint + Prettier
- Unified formatter and linter in one tool
- Built-in import organization
- TypeScript-first design
- Zero configuration for most use cases

## Installation

Biome is installed as a workspace dev dependency:

```bash
pnpm add -D -w @biomejs/biome
```

## Configuration

Biome is configured via `biome.json` in the workspace root:

### Current Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.13/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "experimentalScannerIgnores": [
      "node_modules",
      "dist",
      "build",
      "target",
      ".nx",
      ".pnpm-store"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": { "recommended": true },
      "complexity": { "recommended": true },
      "correctness": { "recommended": true },
      "performance": { "recommended": true },
      "security": { "recommended": true },
      "style": { "recommended": true },
      "suspicious": { "recommended": true }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "semicolons": "asNeeded",
      "trailingCommas": "es5"
    }
  },
  "json": {
    "formatter": {
      "enabled": true
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

### Configuration Details

- **Indentation**: 2 spaces
- **Line Width**: 100 characters
- **Quotes**: Double quotes for all strings
- **Semicolons**: As needed (omitted when not required)
- **Trailing Commas**: ES5 style (allowed in objects/arrays)
- **Import Organization**: Enabled (auto-sorts imports)

## Available Commands

### Workspace-Level Commands

Run from the workspace root:

```bash
# Check formatting and linting (dry run)
pnpm biome:check

# Fix all issues (formatting, linting, imports)
pnpm biome:check:fix

# Format only
pnpm biome:format

# Check specific file/directory
npx @biomejs/biome check apps/fe/newtab/src

# Fix specific file/directory
npx @biomejs/biome check --write apps/fe/newtab/src
```

### NX Project Commands

Biome commands are available for each project:

```bash
# Check newtab app
nx run newtab:biome:check

# Fix newtab app
nx run newtab:biome:fix

# Check autocomplete-input
nx run autocomplete-input:biome:check

# Check news
nx run news:biome:check

# Check shared library
nx run shared:biome:check
```

### Direct Biome CLI

```bash
# Format files
biome format --write

# Lint files and apply safe fixes
biome lint --write

# Run format, lint, and apply fixes
biome check --write

# Check without modifying
biome check

# Apply unsafe fixes
biome check --write --unsafe
```

## Integration with Development Workflow

### Pre-Commit Hook

Biome integrates with git to check only changed files:

```bash
biome check --changed
```

### Pre-Build

Consider adding Biome checks to build pipelines:

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "biome check apps/fe/newtab",
          "vite build"
        ]
      }
    }
  }
}
```

## Editor Setup

### VSCode

Install the Biome extension:

```bash
code --install-extension biomejs.biome
```

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### JetBrains (WebStorm, IntelliJ IDEA)

1. Go to Settings/Preferences → Plugins
2. Search for "Biome"
3. Install and restart
4. Configure in Settings → Tools → Biome

## Migration Status

ESLint has been successfully removed from this project. All linting and formatting is now handled by Biome.

### What Was Migrated

- Removed `@nx/eslint` from root `package.json`
- Removed `eslint.config.js` files from all frontend apps
- Removed `lint` targets from all `project.json` files
- Updated all lint scripts to use Biome (`biome check .`)
- Biome configuration covers all previously used rules (React, TypeScript, style, correctness)

### Current State

The monorepo now uses Biome as the exclusive linting and formatting tool. All ESLint dependencies and configurations have been removed.

## Available Commands

### Workspace-Level Commands

Run from the workspace root:

```bash
# Check formatting and linting (dry run)
pnpm lint

# Fix all issues (formatting, linting, imports)
pnpm lint:fix

# NX Project Commands

# Check specific project
nx run newtab:biome:check
nx run autocomplete-input:biome:check
nx run news:biome:check
nx run shared:biome:check

# Fix specific project
nx run newtab:biome:fix
nx run autocomplete-input:biome:fix
nx run news:biome:fix
nx run shared:biome:fix
```

## Configuration

### Configuration Errors

If you see configuration errors:

```bash
# Validate configuration
biome migrate write biome.json
```

### Ignore Files Not Working

Add to `biome.json` under `files.experimentalScannerIgnores`:

```json
{
  "files": {
    "experimentalScannerIgnores": [
      "node_modules",
      "dist",
      "build"
    ]
  }
}
```

### Performance Issues

Biome is already fast, but for large monorepos:

```bash
# Use caching
biome check --cache

# Parallelize with NX
nx run-many -t biome:check --all --parallel=4
```

## Best Practices

1. **Run on Git Hooks**: Integrate Biome with pre-commit hooks
2. **CI/CD**: Add Biome checks to pull request validation
3. **Consistent Formatting**: Let Biome handle all formatting
4. **Gradual Migration**: Keep ESLint during transition if needed
5. **Update Regularly**: Biome is actively developed

## NX Integration

Biome targets are added to each project's `project.json`:

```json
{
  "targets": {
    "biome:check": {
      "executor": "nx:run-commands",
      "options": {
        "command": "biome check <project-path>"
      }
    },
    "biome:fix": {
      "executor": "nx:run-commands",
      "options": {
        "command": "biome check --write <project-path>"
      }
    }
  }
}
```

Run Biome on all projects:

```bash
nx run-many -t biome:check --all
nx run-many -t biome:fix --all
```

## Troubleshooting

### Biome Not Formatting on Save

Check editor settings and ensure Biome extension is installed.

### Linter Rules Too Strict

Disable specific rules in `biome.json`:

```json
{
  "linter": {
    "rules": {
      "style": {
        "useNamingConvention": "off"
      }
    }
  }
}
```

### Import Organization Issues

Configure import sorting behavior:

```json
{
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

## Resources

- [Official Biome Documentation](https://biomejs.dev)
- [Biome CLI Reference](https://biomejs.dev/reference/cli/)
- [Configuration Schema](https://biomejs.dev/reference/configuration/)
- [VSCode Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [GitHub Repository](https://github.com/biomejs/biome)

---

**Last Updated**: January 31, 2026
