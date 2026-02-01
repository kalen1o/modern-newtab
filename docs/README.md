# NewTab Application Documentation

Welcome to NewTab application documentation. This directory contains comprehensive guides for implementing a hybrid monorepo that combines:

- **Backend Monorepo**: Java Spring Boot microservices with shared infrastructure
- **Frontend Microfrontends**: React applications with module federation architecture
- **Shared Libraries**: TypeScript libraries for cross-service type sharing and utilities

This is a unified monorepo managed by NX that orchestrates both backend Java services and frontend React applications.

## Documentation Structure

The documentation is organized by implementation phases. Each phase includes:
|- Overview and objectives
|- Step-by-step implementation guide
|- Code examples
|- Testing procedures
|- Verification checklists

## Architecture Overview

This project implements a **Hybrid Monorepo** architecture that combines two distinct architectural patterns:

### Backend: Java Spring Boot Monorepo
- Multiple Spring Boot microservices (`auth-service`, `newtab-service`)
- Shared infrastructure and configuration
- Unified database schema managed by Flyway migrations
- Common security components and JWT utilities
- Coordinated build and deployment processes
- Managed within the same monorepo structure as frontend

### Frontend: React Microfrontends
- Host application (`newtab-shell`) with Module Federation
- Remote microfrontends (`autocomplete`, `news`, `sponsor-admin`)
- Independent build and deployment
- Shared TypeScript libraries (`libs/shared`) for type safety
- Module Federation for runtime composition

### Unified Workspace
- NX workspace orchestrates both backend and frontend applications
- Single monorepo for all services and applications
- Shared libraries bridge Java backend and React frontend
- Coordinated dependency management for all services
- Unified build, test, and deployment workflows

**Key Benefits:**
- Single source of truth for all code
- Shared types between backend and frontend via `libs/shared`
- Unified tooling (NX) for all applications
- Simplified dependency management
- Consistent development environment across all services

## Phases

### 1. [Monorepo Infrastructure Setup](./01-monorepo-infrastructure.md)

Initialize NX workspace, restructure project into monorepo, and design database schema.

**Topics:**
|- NX workspace manual setup for existing code
|- Directory structure reorganization
|- Database schema design (PostgreSQL tables)
|- Workspace configuration files

**Key Files:**
|- `nx.json`
|- `package.json` (root)
|- `pnpm-workspace.yaml`
|- `tsconfig.base.json`

---

### 2. [Backend Implementation](./02-backend-implementation.md)

Implement Spring Boot services for authentication and core functionality.

**Architecture:**
This project implements a **Backend Monorepo** pattern where multiple Spring Boot microservices share:
- Common infrastructure and configuration
- Shared database and migrations
- Reusable security components
- Unified build and deployment processes

**Topics:**
|- Authentication Service (JWT, guest access, email/password)
|- NewTab Service (sponsors, history, news, preferences)
|- Database configuration with Flyway migrations
|- Entity, repository, service, controller patterns

**Key Technologies:**
|- Spring Boot 3.2.x
|- Spring Security
|- JWT (io.jsonwebtoken)
|- Spring Data JPA
|- PostgreSQL

**Endpoints:**
|- `/api/auth/*` - Authentication
|- `/api/history/*` - Search history
|- `/api/sponsors/*` - Sponsor management
|- `/api/news/*` - News feed
|- `/api/preferences/*` - User preferences

---

### 3. [Frontend Microfrontends Setup](./03-frontend-microfrontends.md)

Set up React applications with module federation.

**Topics:**
|- Vite plugin federation configuration
|- NewTab shell (host application)
|- Autocomplete input module (remote)
|- Sponsor admin application
|- Component architecture

**Key Technologies:**
|- React 19
|- Vite 7
|- TypeScript 5
|- @originjs/vite-plugin-federation

**Applications:**
|- `newtab-shell` (port 5173)
|- `autocomplete-input` (port 5001)
|- `sponsor-admin` (port 5174)

---

### 4. [Nginx Configuration](./04-nginx-configuration.md)

Configure Nginx as reverse proxy with authentication middleware.

**Topics:**
|- Reverse proxy routing
|- Authentication middleware (auth_request)
|- Guest access handling
|- CORS configuration
|- Static asset serving
|- SSL/TLS setup

**Routing:**
|- `/api/auth/*` → auth-service:8081
|- `/api/*` → newtab-service:8082
|- `/admin/*` → sponsor-admin:5174
|- `/` → newtab-shell:5173

---

### 5. [Docker & Orchestration](./05-docker-orchestration.md)

Containerize all services and orchestrate with Docker Compose.

**Topics:**
|- Docker Compose configuration
|- Dockerfiles for all services
|- Environment variables management
|- Health checks
|- Volume management
|- Network configuration
|- Service scaling

**Services:**
|- PostgreSQL (5432)
|- auth-service (8081)
|- newtab-service (8082)
|- newtab-shell (5173)
|- autocomplete (5001)
|- sponsor-admin (5174)
|- nginx (80, 443)

---

### 6. [Implementation Details](./06-implementation-details.md)

Specific implementation details for core features.

**Topics:**
|- Sponsor rotation logic (simple random)
|- Search history flow
|- News feed integration (RSS fetching)
|- Settings & theme management
|- Frontend hooks and components

**Features:**
|- Random sponsor selection
|- Search history CRUD
|- RSS news caching (every 30 minutes)
|- Theme switching (light/dark/auto)
|- Visibility toggles

---

### 7. [NX Workspace Configuration](./07-nx-workspace.md)

Configure NX workspace with project.json files and custom generators.

**Topics:**
|- Project.json configuration for all apps
|- NX cache and performance
|- Dependency graph visualization
|- Affected commands
|- Custom NX generators
|- NX workspace scripts

**NX Commands:**
|- `nx run <project>:<target>` - Run specific target
|- `nx run-many -t <target> --all` - Run target on all projects
|- `nx affected -t build` - Build only changed projects
|- `nx graph` - Visualize dependencies

---

### 8. [Testing & Documentation](./08-testing-documentation.md)

Testing strategies and comprehensive documentation.

**Topics:**
|- Backend testing (JUnit5, Mockito)
|- Frontend testing (Vitest, React Testing Library)
|- E2E testing (Playwright)
|- Main README
|- API documentation
|- Development guide

**Testing Coverage:**
|- Unit tests (components, services)
|- Integration tests (API endpoints)
|- E2E tests (user flows)
|- Test execution and CI integration

---

### 9. [Security Considerations](./09-security.md)

Security best practices and common vulnerabilities.

**Topics:**
|- JWT token management (expiration, rotation, revocation)
|- Password hashing (BCrypt)
|- CORS configuration
|- SQL injection prevention
|- XSS protection
|- Rate limiting
|- Admin-only endpoint protection
|- Security headers
|- HTTPS/TLS setup
|- Security monitoring and logging

**Security Areas:**
|- Authentication & Authorization
|- Input validation
|- Data protection
|- Network security
|- Monitoring & alerting

---

### 10. [Biome Setup](./10-biome-setup.md)

Code formatting and linting with Biome toolchain.

**Topics:**
|- Biome installation and configuration
|- Formatting and linting rules
|- Command-line usage
|- NX workspace integration
|- Editor setup (VSCode, JetBrains)
|- Migration from ESLint/Prettier
|- CI/CD integration
|- Troubleshooting

**Key Commands:**
|- `pnpm biome:check` - Check formatting and linting
|- `pnpm biome:check:fix` - Fix all issues
|- `nx run <project>:biome:check` - Check specific project
|- `biome check --write` - Direct CLI usage

---

## Quick Reference

### Application Ports

| Service | Port | Description |
|----------|-------|-------------|
| PostgreSQL | 5432 | Database |
| auth-service | 8081 | Authentication API |
| newtab-service | 8082 | Main API |
| newtab-shell | 5173 | Frontend shell |
| autocomplete | 5001 | Autocomplete module |
| sponsor-admin | 5174 | Admin interface |
| nginx | 80/443 | Reverse proxy |

### Key URLs

- **Application**: http://localhost
- **Admin Panel**: http://localhost/admin
- **API**: http://localhost/api
- **Auth API**: http://localhost/api/auth

### Common Commands

```bash
# Start all services (Docker)
docker-compose up -d

# Start development servers
pnpm run dev

# Build all applications
pnpm run build

# Run all tests
pnpm test

# Lint and format all code with Biome
pnpm lint

# Fix linting and formatting issues
pnpm lint:fix

# View NX graph
nx graph

# Build only changed projects
nx affected -t build

# Clean NX cache
nx reset
```

### Environment Variables

Create `.env` file from `.env.example`:

```bash
# Database
POSTGRES_DB=newtab
POSTGRES_USER=newtab
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your-256-bit-secret-key

# Ports (optional)
NGINX_PORT=80
AUTH_SERVICE_PORT=8081
NEWTAB_SERVICE_PORT=8082
```

### Project Structure

```
/Users/kalen_1o/learning/microservice/
├── apps/
│   ├── be/
│   │   ├── auth-service/          # Spring Boot auth
│   │   └── newtab-service/         # Spring Boot main
│   └── fe/
│       ├── newtab/                 # React shell
│       ├── autocomplete-input/     # React module
│       └── sponsor-admin/          # React admin
├── libs/
│   └── shared/                     # Shared library
├── nginx/                          # Nginx config
├── docker/                         # Docker compose
├── docs/                           # This documentation
├── nx.json                         # NX config
├── package.json                     # Root package
├── pnpm-workspace.yaml             # PNPM workspace
└── tsconfig.base.json              # Shared TS config
```

## Implementation Order

Follow this order for optimal implementation:

1. **Phase 1**: Set up NX workspace and directory structure
2. **Phase 2**: Implement backend services (auth, newtab)
3. **Phase 3**: Set up frontend microfrontends with federation
4. **Phase 4**: Configure Nginx routing and auth
5. **Phase 5**: Create Docker compose orchestration
6. **Phase 6**: Implement core features (rotation, history, news, settings)
7. **Phase 7**: Configure NX workspace (project.json, generators)
8. **Phase 8**: Add tests and comprehensive documentation
9. **Phase 9**: Apply security best practices

## Getting Help

### Common Issues

1. **Port Already in Use**
   - Find process: `lsof -i :<port>`
   - Kill process or change port in config

2. **Database Connection Failed**
   - Check PostgreSQL is running: `docker ps | grep postgres`
   - Verify credentials in `.env`
   - Check logs: `docker logs newtab-postgres`

3. **Module Federation Errors**
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Clear NX cache: `nx reset`
   - Verify ports don't conflict

4. **Build Failures**
   - Check logs: `docker-compose logs <service>`
   - Verify dependencies installed: `pnpm install`
   - Check Java version: `java -version` (need 21+)

### Resources

- [NX Documentation](https://nx.dev)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Docker Documentation](https://docs.docker.com)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Contribution

When adding features or fixing bugs:

1. Update relevant documentation
2. Add code examples for new features
3. Update API documentation if endpoints change
4. Add testing procedures for new code
5. Update diagrams if architecture changes

## Documentation Standards

- Clear, step-by-step instructions
- Code examples for all implementations
- Verification checklists for each phase
- Common issues and troubleshooting
- Consistent formatting and style
- Up-to-date with codebase

---

**Last Updated**: January 31, 2026
**Documentation Version**: 1.1
