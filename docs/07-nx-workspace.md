# Phase 7: NX Workspace Configuration

## Overview

This phase covers configuring NX workspace with project.json files, custom generators, and build/test targets for all applications.

## 7.1 Project.json Files

### NX Project Configuration

Each application needs a `project.json` file to define:
- Build targets
- Serve (dev) targets
- Test targets
- Dependencies between projects

### Auth Service Project Configuration

**File:** `/apps/be/auth-service/project.json`

```json
{
  "name": "auth-service",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/be/auth-service/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/js:node",
      "options": {
        "buildTarget": "auth-service:build"
      },
      "configurations": {
        "production": {
          "buildTarget": "auth-service:build:production"
        }
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/be/auth-service",
          "mvn clean package -DskipTests"
        ],
        "parallel": false
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/be/auth-service",
          "mvn test"
        ],
        "parallel": false
      }
    },
    "docker": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "docker build -t newtab-auth-service apps/be/auth-service"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:backend", "scope:auth"]
}
```

### NewTab Service Project Configuration

**File:** `/apps/be/newtab-service/project.json`

```json
{
  "name": "newtab-service",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/be/newtab-service/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/js:node",
      "options": {
        "buildTarget": "newtab-service:build"
      },
      "configurations": {
        "production": {
          "buildTarget": "newtab-service:build:production"
        }
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/be/newtab-service",
          "mvn clean package -DskipTests"
        ],
        "parallel": false
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "cd apps/be/newtab-service",
          "mvn test"
        ],
        "parallel": false
      }
    },
    "docker": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "docker build -t newtab-service apps/be/newtab-service"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:backend", "scope:newtab"]
}
```

### NewTab Shell Project Configuration

**File:** `/apps/fe/newtab/project.json`

```json
{
  "name": "newtab-shell",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/fe/newtab/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/vite:dev",
      "options": {
        "buildTarget": "newtab-shell:build",
        "port": 5173
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/fe/newtab",
        "configFile": "apps/fe/newtab/vite.config.ts"
      },
      "configurations": {
        "production": {
          "mode": "production"
        }
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/fe/newtab/**/*.{ts,tsx,js,jsx}"]
      }
    },
    "docker": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "docker build -t newtab-shell apps/fe/newtab"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:frontend", "scope:shell"]
}
```

### Autocomplete Module Project Configuration

**File:** `/apps/fe/autocomplete-input/project.json`

```json
{
  "name": "autocomplete-input",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/fe/autocomplete-input/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/vite:dev",
      "options": {
        "buildTarget": "autocomplete-input:build",
        "port": 5001
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/fe/autocomplete-input",
        "configFile": "apps/fe/autocomplete-input/vite.config.ts"
      },
      "configurations": {
        "production": {
          "mode": "production"
        }
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/fe/autocomplete-input/**/*.{ts,tsx,js,jsx}"]
      }
    },
    "docker": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "docker build -t autocomplete-module apps/fe/autocomplete-input"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:frontend", "scope:autocomplete"]
}
```

### Sponsor Admin Project Configuration

**File:** `/apps/fe/sponsor-admin/project.json`

```json
{
  "name": "sponsor-admin",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/fe/sponsor-admin/src",
  "projectType": "application",
  "targets": {
    "serve": {
      "executor": "@nx/vite:dev",
      "options": {
        "buildTarget": "sponsor-admin:build",
        "port": 5174
      }
    },
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/apps/fe/sponsor-admin",
        "configFile": "apps/fe/sponsor-admin/vite.config.ts"
      },
      "configurations": {
        "production": {
          "mode": "production"
        }
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/fe/sponsor-admin/**/*.{ts,tsx,js,jsx}"]
      }
    },
    "docker": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "docker build -t sponsor-admin apps/fe/sponsor-admin"
        ],
        "parallel": false
      }
    }
  },
  "tags": ["type:frontend", "scope:admin"]
}
```

### Shared Library Project Configuration

**File:** `/libs/shared/project.json`

```json
{
  "name": "shared",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/shared/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/shared",
        "main": "libs/shared/src/index.ts",
        "tsConfig": "libs/shared/tsconfig.json",
        "assets": []
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["libs/shared/**/*.{ts,tsx,js,jsx}"]
      }
    }
  },
  "tags": ["type:library", "scope:shared"]
}
```

## 7.2 NX Workspace Configuration

### Root nx.json

**File:** `/nx.json`

```json
{
  "version": 2,
  "npmScope": "newtab",
  "affected": {
    "defaultBase": "main"
  },
  "cli": {
    "packageManager": "pnpm",
    "defaultCollection": "@nx/workspace"
  },
  "plugins": [
    {
      "plugin": "@nx/react",
      "options": {
        "buildTargetName": "build",
        "devTargetName": "serve",
        "startTargetName": "serve",
        "componentTest": {
          "targetName": "component-test"
        }
      }
    },
    {
      "plugin": "@nx/js",
      "options": {
        "buildTargetName": "build",
        "testTargetName": "test"
      }
    }
  ],
  "generators": {
    "@nx/react": {
      "application": {
        "bundler": "vite"
      },
      "component": {
        "style": "css"
      },
      "library": {
        "style": "css"
      }
    }
  },
  "defaultProject": "newtab-shell",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["default", "^default"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^default", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": [
        "default",
        "{workspaceRoot}/.eslintrc.json",
        "{workspaceRoot}/.eslintignore"
      ],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.spec.tsx",
      "!{projectRoot}/**/*.test.ts",
      "!{projectRoot}/**/*.test.tsx"
    ],
    "sharedGlobals": []
  },
  "useInferencePlugins": false,
  "$schema": "https://raw.githubusercontent.com/nrwl/monorepo-examples/main/packages/nx-plugin/nx.json"
}
```

### Root package.json

**File:** `/package.json`

```json
{
  "name": "newtab-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nx run-many -t dev -p newtab-shell autocomplete-input sponsor-admin",
    "dev:shell": "nx run newtab-shell:serve",
    "dev:autocomplete": "nx run autocomplete-input:serve",
    "dev:admin": "nx run sponsor-admin:serve",
    "dev:be": "nx run-many -t serve -p auth-service newtab-service",
    "build": "nx run-many -t build -p newtab-shell autocomplete-input sponsor-admin auth-service newtab-service",
    "build:fe": "nx run-many -t build -p newtab-shell autocomplete-input sponsor-admin",
    "build:be": "nx run-many -t build -p auth-service newtab-service",
    "test": "nx run-many -t test --all",
    "test:fe": "nx run-many -t test -p newtab-shell autocomplete-input sponsor-admin",
    "test:be": "nx run-many -t test -p auth-service newtab-service",
    "lint": "nx run-many -t lint --all",
    "docker": "nx run-many -t docker --all",
    "docker:be": "nx run-many -t docker -p auth-service newtab-service",
    "docker:fe": "nx run-many -t docker -p newtab-shell autocomplete-input sponsor-admin",
    "graph": "nx graph",
    "affected": "nx affected -t build",
    "format": "nx format:write",
    "format:check": "nx format:check",
    "nx": "nx"
  },
  "devDependencies": {
    "@nx/js": "^22.4.3",
    "@nx/react": "^22.4.3",
    "@nx/workspace": "^22.4.3",
    "@nx/vite": "^22.4.3",
    "@nx/linter": "^22.4.3",
    "nx": "^22.4.3",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## 7.3 NX Generators

### Overview

Custom generators help automate common tasks like creating new sponsors, microfrontends, or database migrations.

### Directory Structure

```
tools/
├── generators/
│   ├── add-sponsor/
│   │   ├── schema.json
│   │   ├── index.ts
│   │   └── files/
│   ├── create-mfe/
│   │   ├── schema.json
│   │   ├── index.ts
│   │   └── files/
│   └── migration/
│       ├── schema.json
│       ├── index.ts
│       └── files/
└── executors/
```

### Add Sponsor Generator

**File:** `/tools/generators/add-sponsor/schema.json`

```json
{
  "$schema": "http://json-schema.org/schema",
  "cli": "nx",
  "$id": "add-sponsor",
  "type": "object",
  "title": "Add Sponsor",
  "description": "Add a new sponsor to the newtab application",
  "properties": {
    "name": {
      "type": "string",
      "description": "Sponsor name",
      "$default": "",
      "x-prompt": "What is the sponsor name?"
    },
    "type": {
      "type": "string",
      "description": "Sponsor media type",
      "enum": ["image", "video"],
      "$default": "image",
      "x-prompt": "What is the sponsor type?"
    },
    "mediaUrl": {
      "type": "string",
      "description": "Media URL",
      "$default": "",
      "x-prompt": "What is the media URL?"
    },
    "linkUrl": {
      "type": "string",
      "description": "Link URL",
      "$default": "",
      "x-prompt": "What is the link URL (optional)?"
    }
  },
  "required": ["name", "type", "mediaUrl"]
}
```

**File:** `/tools/generators/add-sponsor/index.ts`

```typescript
import {
  Tree,
  formatFiles,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit'
import * as path from 'path'

export default async function addSponsorGenerator(
  tree: Tree,
  options: AddSponsorSchema
) {
  const projectConfig = readProjectConfiguration(tree, 'newtab-service')

  // Create SQL migration file
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)
  const migrationFileName = `V${timestamp}__Add_sponsor_${options.name.replace(/\s+/g, '_').toLowerCase()}.sql`

  const migrationContent = `
-- Add sponsor: ${options.name}
INSERT INTO sponsors (name, type, media_url, link_url, is_active, created_at, updated_at)
VALUES ('${options.name}', '${options.type}', '${options.mediaUrl}', '${options.linkUrl || 'NULL'}', true, NOW(), NOW());
`

  const migrationPath = path.join(
    projectConfig.root,
    'src/main/resources/db/migration',
    migrationFileName
  )

  tree.write(migrationPath, formatFiles(migrationContent.trim()))

  return () => {
    console.log(`Added sponsor migration: ${migrationFileName}`)
  }
}
```

### Create MFE Generator

**File:** `/tools/generators/create-mfe/schema.json`

```json
{
  "$schema": "http://json-schema.org/schema",
  "cli": "nx",
  "$id": "create-mfe",
  "type": "object",
  "title": "Create MFE",
  "description": "Create a new microfrontend application",
  "properties": {
    "name": {
      "type": "string",
      "description": "MFE name",
      "$default": "",
      "x-prompt": "What is the MFE name?",
      "pattern": "^[a-z0-9-]+$"
    },
    "port": {
      "type": "number",
      "description": "Dev server port",
      "$default": 3000,
      "x-prompt": "What is the dev server port?"
    }
  },
  "required": ["name"]
}
```

**File:** `/tools/generators/create-mfe/index.ts`

```typescript
import {
  Tree,
  formatFiles,
  normalizePath,
  readProjectConfiguration,
  updateProjectConfiguration,
  workspaceRoot,
} from '@nx/devkit'
import { applicationGenerator as reactAppGenerator } from '@nx/react'
import * as path from 'path'

export default async function createMfeGenerator(
  tree: Tree,
  options: CreateMFESchema
) {
  // Create React app using NX React generator
  await reactAppGenerator(tree, {
    name: options.name,
    directory: `apps/fe/${options.name}`,
    style: 'css',
    routing: false,
    skipFormat: true,
  })

  // Update vite.config.ts with federation
  const projectRoot = normalizePath(path.join(workspaceRoot(tree), 'apps/fe', options.name))
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts')

  const viteConfigContent = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '${options.name}',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: ${options.port},
    cors: true,
  },
})
`

  tree.write(viteConfigPath, viteConfigContent)

  // Update shell app to load new remote
  const shellViteConfigPath = path.join(
    workspaceRoot(tree),
    'apps/fe/newtab/vite.config.ts'
  )

  const shellConfigContent = tree.read(shellViteConfigPath, 'utf-8')
  const updatedShellConfig = shellConfigContent.replace(
    /remotes:\s*{([^}]*)}/,
    `remotes: {$1\n        ${options.name}: "http://localhost:${options.port}/assets/remoteEntry.js",`
  )

  tree.write(shellViteConfigPath, updatedShellConfig)

  return formatFiles(tree)
}
```

## 7.4 NX Cache

### Overview

NX caches build and test results to speed up subsequent runs.

### Cache Configuration

NX automatically caches:
- Build outputs
- Test results
- Linter results

Cache is based on:
- Source code files
- Configuration files
- Environment variables (if specified)
- Dependencies

### Manual Cache Control

```bash
# Reset cache
nx reset

# View cache stats
nx report

# Skip cache for specific run
nx run newtab-shell:build --skip-nx-cache

# Check cache hit rate
nx report | grep cache
```

### Cache Directory

Default cache location:
- Linux/macOS: `~/.cache/nx`
- Windows: `%LOCALAPPDATA%\nx-cache`

Custom cache location:
```json
{
  "cli": {
    "cacheDirectory": ".nx/cache"
  }
}
```

## 7.5 NX Graph

### Visualize Dependencies

```bash
# Show dependency graph
nx graph

# Show only affected projects
nx graph --affected

# Show specific project dependencies
nx graph --focus=newtab-shell

# Output to file
nx graph --file=graph.json
```

### Dependency Example

```
auth-service
  └── postgres

newtab-service
  └── postgres

newtab-shell
  ├── autocomplete-input
  └── newtab-service
      └── postgres

sponsor-admin
  └── newtab-service
      └── postgres
```

## 7.6 Affected Commands

### Run Only Affected Projects

NX analyzes git history to determine which projects changed and are affected.

```bash
# Build only affected projects
nx affected -t build

# Test only affected projects
nx affected -t test

# Run multiple targets on affected projects
nx affected -t build test

# Base branch for comparison
nx affected -t build --base=origin/main

# Head for comparison
nx affected -t build --head=origin/feature-branch
```

## Verification Checklist

After completing Phase 7:

- [ ] All project.json files created
- [ ] nx.json configured with all plugins
- [ ] Root package.json has all workspace scripts
- [ ] Build targets work for all projects
- [ ] Test targets work for all projects
- [ ] Docker targets work for all projects
- [ ] NX cache is working
- [ ] Dependency graph is correct
- [ ] Affected commands identify correct projects
- [ ] Custom generators (if created) work

## Usage

### Common NX Commands

```bash
# Build specific project
nx run newtab-shell:build

# Run specific project in dev mode
nx run autocomplete-input:serve

# Test all projects
nx run-many -t test --all

# Build all projects in correct order
nx run-many -t build --all

# Lint all projects
nx run-many -t lint --all

# Build only changed projects
nx affected -t build

# Visualize dependencies
nx graph

# Show project details
nx show project newtab-shell

# Show all projects
nx show projects
```

### Development Workflow

```bash
# 1. Start dev servers
pnpm run dev

# 2. Make changes to code

# 3. Build only changed projects
nx affected -t build

# 4. Test only changed projects
nx affected -t test

# 5. Build Docker images for changed projects
nx affected -t docker

# 6. Deploy
docker-compose up -d
```

## Troubleshooting

### NX Cache Issues

```bash
# Clear cache
nx reset

# Clear cache and reinstall node modules
rm -rf node_modules .nx/cache
pnpm install
```

### Project Not Found

```bash
# List all projects
nx show projects

# Check project.json exists
ls apps/fe/newtab/project.json
```

### Build Order Issues

NX automatically determines build order. If issues occur:

1. Check project.json dependsOn sections
2. Verify implicit dependencies are defined
3. Use `nx graph` to visualize

### Performance

If NX is slow:

```bash
# Enable verbose logging
nx run newtab-shell:build --verbose

# Check cache hit rate
nx report

# Increase parallelization (in nx.json)
{
  "cli": {
    "parallel": true,
    "defaultConcurrency": 4
  }
}
```

## Best Practices

1. **Use affected commands**: Save time by only building/testing changed code
2. **Organize by tags**: Use project tags for logical grouping
3. **Leverage cache**: Let NX cache build results
4. **Customize workspace**: Add generators for common tasks
5. **Monitor cache health**: Regularly check cache hit rate
6. **Keep dependencies clear**: Avoid circular dependencies
7. **Use workspace libs**: Share code via /libs
8. **Version control nx.json**: Keep workspace configuration in git
9. **Parallelize where safe**: Use run-many for independent tasks
10. **Use graph**: Visualize dependencies regularly

## Next Steps

Proceed to [Phase 8: Testing & Documentation](./08-testing-documentation.md)
