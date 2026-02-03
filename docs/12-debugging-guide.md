# Debugging Guide

## Overview

This guide covers debugging configurations for the NewTab microservice monorepo, including VS Code launch configurations for local development and Nx Cloud launch templates for distributed CI/CD.

## Table of Contents

1. [VS Code Debugging](#vs-code-debugging)
2. [Nx Cloud Launch Templates](#nx-cloud-launch-templates)
3. [Troubleshooting](#troubleshooting)
4. [Best Practices](#best-practices)

---

## VS Code Debugging

### Prerequisites

Install the following VS Code extensions:

```bash
code --install-extension msjsdiag.debugger-for-chrome
code --install-extension vscjava.vscode-java-debugger
code --install-extension redhat.java
```

### Frontend Debugging (React/Vite)

#### Debug NewTab Shell (Port 5173)

The NewTab shell is the main application that loads microfrontends via module federation.

**Steps:**
1. Open VS Code
2. Press `F5` or click the Run and Debug panel
3. Select "Debug NewTab Shell" from the dropdown
4. Set breakpoints in your code
5. Refresh the browser at `http://localhost:5173`

**What happens:**
- VS Code launches Chrome with remote debugging enabled
- Pre-launch task starts `pnpm dev` in `apps/fe/newtab`
- Source maps are enabled for proper breakpoint mapping
- Console logs appear in VS Code's Debug Console

#### Debug Autocomplete MFE (Port 5001)

Debug the autocomplete microfrontend independently.

**Steps:**
1. Select "Debug Autocomplete MFE" from the debug configuration
2. Press `F5` to start
3. The app will be available at `http://localhost:5001`

**Use case:** Debug autocomplete component logic without loading the full shell.

#### Debug News MFE (Port 5002)

Debug the news microfrontend independently.

**Steps:**
1. Select "Debug News MFE" from the debug configuration
2. Press `F5` to start
3. The app will be available at `http://localhost:5002`

#### Debug All Frontend MFEs Together

Use the compound configuration to debug all three frontend apps simultaneously.

**Steps:**
1. Select "Debug All Frontend MFEs" from the dropdown
2. Press `F5`
3. All three apps will start in parallel:
   - NewTab Shell: http://localhost:5173
   - Autocomplete: http://localhost:5001
   - News: http://localhost:5002

**Note:** When debugging module federation, breakpoints in remote MFEs may require:
1. Using the specific MFE debug configuration
2. Ensuring the remote entry URL matches your `vite.config.ts` configuration
3. Setting breakpoints in the exposed component file

### Backend Debugging (Spring Boot/Java)

#### Debug Auth Service (Port 8081)

Debug the Spring Boot authentication service.

**Steps:**
1. Build the service: `nx run auth-service:build`
2. Start the service with debug flags:
   ```bash
   cd apps/be/auth-service
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar target/auth-service-1.0.0.jar
   ```
3. In VS Code, select "Debug Auth Service"
4. Press `F5` to attach the debugger

**Configuration details:**
- Debug port: 5005
- Timeout: 30000ms (30 seconds)
- Project name: auth-service

#### Debug NewTab Service (Port 8080)

Debug the Spring Boot main service.

**Steps:**
1. Build the service: `nx run newtab-service:build`
2. Start the service with debug flags:
   ```bash
   cd apps/be/newtab-service
   java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5006 -jar target/newtab-service-1.0.0.jar
   ```
3. In VS Code, select "Debug NewTab Service"
4. Press `F5` to attach the debugger

**Configuration details:**
- Debug port: 5006
- Timeout: 30000ms (30 seconds)
- Project name: newtab-service

#### Debug All Backend Services Together

Use the compound configuration to debug both Spring Boot services.

**Steps:**
1. Build both services: `nx run-many -t build -p auth-service newtab-service`
2. Start each service with debug flags (ports 5005 and 5006)
3. Select "Debug All Backend Services"
4. Press `F5`

### Test Debugging

#### Debug Jest Tests (newtab)

Debug Jest tests for the newtab shell application.

**Steps:**
1. Set breakpoints in your test files (`.spec.ts` or `.test.ts`)
2. Select "Debug Jest Tests (newtab)"
3. Press `F5`
4. The debugger will pause at the first breakpoint

**Configuration:**
- Debug port: 9229
- Command: `nx test newtab`
- Source maps enabled for TS/TSX files

#### Debug Jest Tests (autocomplete)

Debug tests for the autocomplete microfrontend.

**Steps:**
1. Select "Debug Jest Tests (autocomplete)"
2. Press `F5`
3. Debug port: 9230

#### Debug Jest Tests (news)

Debug tests for the news microfrontend.

**Steps:**
1. Select "Debug Jest Tests (news)"
2. Press `F5`
3. Debug port: 9231

#### Debug Jest Tests (shared)

Debug tests for the shared library.

**Steps:**
1. Select "Debug Jest Tests (shared)"
2. Press `F5`
3. Debug port: 9232

**Tip:** To debug a specific test file, modify the debug configuration to add test file filtering:

```json
"runtimeArgs": [
  "--inspect-brk=9229",
  "${workspaceFolder}/node_modules/@nx/cli/bin/nx.js",
  "test",
  "newtab",
  "--testFile=src/components/MyComponent.spec.ts"
]
```

### Docker Compose Debugging

#### Debug with Docker Compose

Debug services running in Docker containers.

**Steps:**
1. Start Docker Compose: `docker-compose -f docker/docker-compose.yml up -d`
2. Wait for services to be healthy
3. Select "Debug with Docker Compose"
4. Press `F5`

**Prerequisites:**
- Services must expose debug ports
- Use `--inspect` or `--inspect-brk` flags in Dockerfile or docker-compose.yml
- The debugger attaches to `localhost:9229`

**Example Dockerfile with debug support:**

```dockerfile
# apps/be/auth-service/Dockerfile
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY target/auth-service-1.0.0.jar app.jar

# Debug mode support
ENV JAVA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
EXPOSE 8081 5005

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

## Nx Cloud Launch Templates

Launch templates define setup steps for Nx Cloud agents in distributed CI/CD environments.

### Available Templates

#### linux-medium-js

**Purpose:** Frontend React/Vite builds

**Resource class:** `docker_linux_amd64/medium`
- 2 vCPUs
- 8GB RAM

**Image:** `ubuntu22.04-node20.11-v9`

**Features:**
- Node.js 20.11
- pnpm workspace support
- Node modules caching
- Browser binary caching (Chrome, Firefox, Edge)
- Source code checkout
- Dependency installation

**Usage:**
```bash
nx-cloud start-ci-run --distribute-on="3 linux-medium-js"
```

#### linux-large-java

**Purpose:** Backend Spring Boot/Java builds

**Resource class:** `docker_linux_amd64/large`
- 4 vCPUs
- 16GB RAM

**Image:** `ubuntu22.04-node20.11-v9`

**Features:**
- Node.js 20.11
- Java 21 (matches your Spring Boot services)
- Maven dependency caching (`~/.m2/repository`)
- Node modules caching
- Source code checkout
- Dependency installation

**Usage:**
```bash
nx-cloud start-ci-run --distribute-on="4 linux-large-java"
```

#### linux-fullstack

**Purpose:** Combined template for full monorepo builds

**Resource class:** `docker_linux_amd64/large`
- 4 vCPUs
- 16GB RAM

**Image:** `ubuntu22.04-node20.11-v9`

**Features:**
- All frontend and backend capabilities
- Parallel dependency installation
- Node.js 20.11 + Java 21
- Multiple cache layers (npm, maven, browsers)
- Docker-in-Docker support for service testing
- Optimized for fast agent startup

**Parallel Steps:**
- Node.js dependencies
- Maven dependencies (auth-service, newtab-service)
- Cache restoration (npm, maven, browsers)
- Browser binary installation

**Usage:**
```bash
nx-cloud start-ci-run --distribute-on="6 linux-fullstack"
```

#### linux-small-js

**Purpose:** Quick fixes and patches

**Resource class:** `docker_linux_amd64/small`
- 1 vCPU
- 4GB RAM

**Image:** `ubuntu22.04-node20.11-v9`

**Features:**
- Minimal setup for quick builds
- Fast cache restoration
- Suitable for linting, formatting, small test runs

**Usage:**
```bash
nx-cloud start-ci-run --distribute-on="2 linux-small-js"
```

#### linux-xl-fullstack

**Purpose:** Performance-intensive builds

**Resource class:** `docker_linux_amd64/extra_large`
- 8 vCPUs
- 32GB RAM

**Image:** `ubuntu22.04-node20.11-v9`

**Features:**
- Maximum compute power
- All fullstack features
- Docker-in-Docker support
- Optimized for long-running tasks (E2E tests, full builds)

**Usage:**
```bash
nx-cloud start-ci-run --distribute-on="4 linux-xl-fullstack"
```

### Cache Configuration

All templates use intelligent caching to speed up agent initialization:

**Node Modules Cache:**
```yaml
key: 'pnpm-lock.yaml|patches/**/*|.yarn/patches/**/*|pnpm-patches/**/*'
paths: |
  ~/.local/share/pnpm/store
  node_modules
  .nx/cache
base-branch: 'main'
```

**Maven Cache:**
```yaml
key: 'apps/be/*/pom.xml'
paths: |
  ~/.m2/repository
base-branch: 'main'
```

**Browser Binaries Cache:**
```yaml
key: 'pnpm-lock.yaml|"browsers"'
paths: |
  ~/.cache/Cypress
base-branch: 'main'
```

### Custom Node Version

To use a different Node.js version, modify the launch template:

```yaml
launch-templates:
  custom-node:
    resource-class: 'docker_linux_amd64/medium'
    image: 'ubuntu22.04-node20.11-v9'
    init-steps:
      - name: Checkout
        uses: 'nrwl/nx-cloud-workflows/v5/workflow-steps/checkout/main.yaml'
      - name: Install Node
        uses: 'nrwl/nx-cloud-workflows/v5/workflow-steps/install-node/main.yaml'
        inputs:
          node_version: '21'
      # ... other steps
```

### Environment Variables

Pass environment variables to agents:

```bash
nx-cloud start-ci-run \
  --distribute-on="4 linux-fullstack" \
  --with-env-vars="POSTGRES_USER,POSTGRES_PASSWORD,JWT_SECRET"
```

### Dynamic Changesets

Configure Nx Cloud to use different agent counts based on changeset size.

Create `.nx/workflows/dynamic-changesets.yaml`:

```yaml
distribute-on:
  small-changeset: 2 linux-small-js
  medium-changeset: 4 linux-medium-js
  large-changeset: 8 linux-fullstack
```

Usage:
```bash
nx-cloud start-ci-run --distribute-on=".nx/workflows/dynamic-changesets.yaml"
```

### Validation

Validate your launch templates before using them in CI:

```bash
nx-cloud validate --workflow-file=./.nx/workflows/agents.yaml
```

**Note:** Commit your changes to git before validation.

---

## Troubleshooting

### VS Code Debugging Issues

#### Debugger doesn't attach

**Problem:** Debugger starts but cannot connect to the target.

**Solutions:**

1. Check if the service is running:
   ```bash
   # Frontend
   curl http://localhost:5173
   # Backend
   curl http://localhost:8081/actuator/health
   ```

2. Verify debug port is not in use:
   ```bash
   lsof -i :5005  # Auth service
   lsof -i :5006  # NewTab service
   lsof -i :9229  # Jest tests
   ```

3. Ensure no firewall blocking:
   ```bash
   # macOS
   sudo pfctl -d  # Disable firewall temporarily
   ```

4. Check VS Code output console for connection errors

#### Breakpoints not hit

**Problem:** Breakpoints show as unverified or never pause execution.

**Solutions:**

1. Enable source maps in your vite.config.ts:
   ```typescript
   export default defineConfig({
     build: {
       sourcemap: true, // Ensure this is set
     }
   })
   ```

2. Verify tsconfig.json source maps:
   ```json
   {
     "compilerOptions": {
       "sourceMap": true,
       "inlineSourceMap": false
     }
   }
   ```

3. Use the correct debug configuration (frontend vs backend)

4. For Jest tests, disable code coverage:
   ```bash
   nx test newtab --codeCoverage=false
   ```

#### Module Federation Debugging Issues

**Problem:** Cannot set breakpoints in remote MFE components.

**Solutions:**

1. Debug the MFE directly using its specific configuration
   - "Debug Autocomplete MFE" for port 5001
   - "Debug News MFE" for port 5002

2. Verify remote entry URL in shell's vite.config.ts matches running port:
   ```typescript
   remotes: {
     autocomplete: "http://localhost:5001/assets/remoteEntry.js",
     news: "http://localhost:5002/assets/remoteEntry.js",
   }
   ```

3. Use Chrome DevTools as fallback:
   - Open Chrome DevTools (F12)
   - Go to Sources panel
   - Find webpack:// resources for remote MFEs

### Nx Cloud Issues

#### Agent startup failures

**Problem:** Agents fail to start or complete initialization steps.

**Solutions:**

1. Check agent logs in Nx Cloud dashboard
2. Validate launch template:
   ```bash
   nx-cloud validate --workflow-file=./.nx/workflows/agents.yaml
   ```
3. Verify workflow file is committed to git
4. Check for syntax errors in agents.yaml (YAML indentation)

#### Cache misses

**Problem:** Cache is not being used, causing slow builds.

**Solutions:**

1. Verify cache key matches lockfile:
   ```yaml
   key: 'pnpm-lock.yaml|patches/**/*'
   ```

2. Check cache paths are accessible
3. Review cache hit rate in Nx Cloud dashboard
4. Manually clear cache if corrupted:
   ```bash
   nx reset
   rm -rf .nx/cache
   ```

#### Out of memory errors

**Problem:** Agents run out of memory during builds.

**Solutions:**

1. Use larger resource class:
   - Change `medium` to `large` or `extra_large`
   - Example: `docker_linux_amd64/large`

2. Limit parallel tasks:
   ```bash
   nx-cloud start-ci-run --distribute-on="2 linux-large-java"
   ```

3. Increase Node.js memory limit:
   ```yaml
   env:
     NODE_OPTIONS: "--max-old-space-size=4096"
   ```

### Docker Debugging Issues

#### Cannot connect to container

**Problem:** Debugger cannot attach to service in Docker container.

**Solutions:**

1. Expose debug port in docker-compose.yml:
   ```yaml
   services:
     auth-be:
       ports:
         - "${AUTH_BE_PORT}:8081"
         - "5005:5005"  # Debug port
   ```

2. Use `host.docker.internal` for macOS/Windows:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

3. Check if service is running with debug flags:
   ```bash
   docker logs auth-be | grep "Listening for transport dt_socket"
   ```

#### Performance issues with Docker

**Problem:** Debugging is slow with Docker.

**Solutions:**

1. Use volume mounts for source code
2. Avoid Docker-in-Docker for debugging
3. Consider using host networking (Linux only):
   ```yaml
   services:
     auth-be:
       network_mode: host
   ```

---

## Best Practices

### VS Code Debugging

1. **Use compound configurations** for complex scenarios
   - "Debug All Frontend MFEs" for module federation
   - "Debug All Backend Services" for API integration

2. **Set breakpoints strategically**
   - Break in handlers/controllers (backend)
   - Break in component entry points (frontend)
   - Use conditional breakpoints for loops

3. **Log alongside debugging**
   - Use `console.log` for quick checks
   - Use debugger for stepping through logic
   - Combine both for efficiency

4. **Profile for performance**
   - Use Chrome DevTools Performance tab
   - Profile CPU/memory in Java with VisualVM
   - Analyze bundle size with webpack-bundle-analyzer

### Nx Cloud Templates

1. **Choose appropriate resource class**
   - `small` for linting, formatting, unit tests
   - `medium` for frontend builds
   - `large` for backend builds and E2E tests
   - `extra_large` for performance-intensive tasks

2. **Optimize cache keys**
   - Include all lockfiles: `pnpm-lock.yaml`, `pom.xml`
   - Include patches directory to bust cache on changes
   - Use base branch comparison

3. **Use parallel steps** where safe
   - Dependency installation can be parallel
   - Cache restoration can be parallel
   - Service startup must be serial

4. **Monitor CI/CD metrics**
   - Track cache hit rate
   - Monitor agent startup time
   - Adjust agent count based on changeset size

### General

1. **Version control debugging configurations**
   - Commit `.vscode/launch.json` and `.vscode/tasks.json`
   - Commit `.nx/workflows/agents.yaml`
   - Document any project-specific changes

2. **Document custom ports**
   - Maintain a port allocation table
   - Update documentation when changing ports
   - Coordinate with team to avoid conflicts

3. **Secure sensitive data**
   - Never commit environment variables
   - Use `--with-env-vars` for Nx Cloud
   - Use `.env.example` for reference

4. **Test debug configurations**
   - Verify all debug configs work after changes
   - Test Nx Cloud templates in staging
   - Keep documentation up to date

---

## Port Reference

| Service | App | Port | Debug Port |
|----------|------|-------|------------|
| NewTab Shell | newtab | 5173 | - |
| Autocomplete MFE | autocomplete-input | 5001 | - |
| News MFE | news | 5002 | - |
| Auth Service | auth-service | 8081 | 5005 |
| NewTab Service | newtab-service | 8080 | 5006 |
| Jest Tests | newtab | - | 9229 |
| Jest Tests | autocomplete-input | - | 9230 |
| Jest Tests | news | - | 9231 |
| Jest Tests | shared | - | 9232 |

---

## Additional Resources

- [Nx Cloud Documentation](https://nx.dev/docs/nx-cloud/overview)
- [Nx Launch Templates](https://nx.dev/docs/reference/nx-cloud/launch-templates)
- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Java Debug Wire Protocol](https://docs.oracle.com/javase/8/docs/technotes/guides/jpda/)
