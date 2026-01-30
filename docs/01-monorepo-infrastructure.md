# Phase 1: Monorepo Infrastructure Setup

## Overview

This phase covers setting up the NX workspace, restructuring the project into a monorepo, and establishing the database schema.

## 1.1 Initialize NX Workspace (Manual Setup for Existing Code)

### Prerequisites
- Existing frontend apps in `/fe/` directory
- Node.js 18+ installed
- pnpm package manager

### Step 1: Install NX CLI Locally

Since we have existing code, we cannot use `create-nx-workspace` which requires a fresh directory. Instead, we manually convert the project.

**Commands:**
```bash
# Install NX and required plugins as dev dependencies at workspace root
pnpm add -D -w nx @nx/workspace @nx/react @nx/js
```

### Step 2: Create NX Configuration

Create `/nx.json`:

```json
{
  "version": 2,
  "npmScope": "newtab",
  "affected": {
    "defaultBase": "main"
  },
  "cli": {
    "packageManager": "pnpm"
  },
  "plugins": [
    {
      "plugin": "@nx/react",
      "options": {
        "buildTargetName": "build",
        "devTargetName": "dev",
        "startTargetName": "serve"
      }
    },
    {
      "plugin": "@nx/js",
      "options": {
        "buildTargetName": "build"
      }
    }
  ],
  "$schema": "https://raw.githubusercontent.com/nrwl/monorepo-examples/main/packages/nx-plugin/nx.json"
}
```

**Key configuration points:**
- `npmScope`: Sets the scope for internal packages (@newtab/*)
- `packageManager`: Tells NX to use pnpm
- `plugins`: Enables React and JS plugins for build/dev targets

### Step 3: Create Root package.json

Create `/package.json` at workspace root:

```json
{
  "name": "newtab-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nx run-many -t dev -p newtab-shell autocomplete",
    "build": "nx run-many -t build -p newtab-shell autocomplete",
    "test": "nx run-many -t test -p newtab-shell autocomplete"
  },
  "devDependencies": {
    "@nx/js": "^22.4.3",
    "@nx/react": "^22.4.3",
    "@nx/workspace": "^22.4.3",
    "nx": "^22.4.3"
  }
}
```

### Step 4: Create PNPM Workspace Configuration

Create `/pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'apps/fe/*'
  - 'apps/be/*'
  - 'libs/*'
```

This tells pnpm to treat directories under `apps/` and `libs/` as workspace packages.

### Step 5: Create Shared TypeScript Configuration

Create `/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx"
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

## 1.2 Directory Structure Setup

### Migration Steps

#### Step 1: Create Apps Directory Structure

```bash
# Create the apps directory structure
mkdir -p apps/fe
mkdir -p apps/be
mkdir -p libs/shared
```

#### Step 2: Move Existing Frontend Apps

```bash
# Move newtab app
mv fe/newtab apps/fe/newtab

# Move autocomplete-input app
mv fe/autocomplete-input apps/fe/autocomplete-input

# Remove empty fe directory (if empty)
rm -rf fe
```

#### Step 3: Create Backend Service Directories

```bash
# Create auth-service directory structure
mkdir -p apps/be/auth-service/src/main/java/com/newtab/auth
mkdir -p apps/be/auth-service/src/main/resources
mkdir -p apps/be/auth-service/src/test/java/com/newtab/auth

# Create newtab-service directory structure
mkdir -p apps/be/newtab-service/src/main/java/com/newtab/service
mkdir -p apps/be/newtab-service/src/main/resources/db/migration
mkdir -p apps/be/newtab-service/src/test/java/com/newtab/service
```

#### Step 4: Create Nginx and Docker Directories

```bash
mkdir -p nginx
mkdir -p docker
```

#### Step 5: Verify Final Structure

Your structure should look like:

```
/Users/kalen_1o/learning/microservice/
├── apps/
│   ├── be/
│   │   ├── auth-service/
│   │   │   ├── src/main/java/com/newtab/auth/
│   │   │   ├── src/main/resources/
│   │   │   └── src/test/java/com/newtab/auth/
│   │   └── newtab-service/
│   │       ├── src/main/java/com/newtab/service/
│   │       ├── src/main/resources/db/migration/
│   │       └── src/test/java/com/newtab/service/
│   └── fe/
│       ├── newtab/ (moved from fe/newtab)
│       ├── autocomplete-input/ (moved from fe/autocomplete-input)
│       └── sponsor-admin/ (to be created)
├── libs/
│   └── shared/
├── nginx/
├── docker/
├── docs/
├── nx.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 1.3 Database Schema Design

### Overview

PostgreSQL will store user data, search history, sponsors, news cache, and user preferences.

### Table Schema

#### Users Table

Stores email/password authenticated users.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `email`: Unique email address for login
- `password_hash`: BCrypt hashed password (never store plain text)
- `created_at`, `updated_at`: Timestamps for auditing

#### Search History Table

Stores user search queries.

```sql
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_search_history_created ON search_history(created_at DESC);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `user_id`: FK to users table (NULL for guest users)
- `query`: The search query text
- `created_at`: When the search was made

#### Sponsors Table

Stores sponsor content for background display.

```sql
CREATE TABLE sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video')),
    media_url VARCHAR(1000) NOT NULL,
    link_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sponsors_active ON sponsors(is_active);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `name`: Sponsor name/identifier
- `type`: Media type ('image' or 'video')
- `media_url`: URL to the image or video file
- `link_url`: URL to navigate when sponsor is clicked
- `is_active`: Whether to include in rotation
- `created_at`, `updated_at`: Timestamps

#### Sponsor Settings Table

Global settings for sponsor rotation.

```sql
CREATE TABLE sponsor_settings (
    id SERIAL PRIMARY KEY,
    rotation_strategy VARCHAR(50) NOT NULL DEFAULT 'random',
    display_duration INTEGER DEFAULT 30000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO sponsor_settings (rotation_strategy, display_duration)
VALUES ('random', 30000);
```

**Columns:**
- `id`: Primary key (singleton table)
- `rotation_strategy`: Strategy for selecting sponsors ('random', 'sequential')
- `display_duration`: How long to display each sponsor (ms)
- `updated_at`: Last settings update

#### News Articles Table

Caches news feed articles.

```sql
CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(100),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_published ON news_articles(published_at DESC);
CREATE INDEX idx_news_source ON news_articles(source);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `title`: Article headline
- `description`: Article summary
- `url`: Link to full article
- `source`: News source name
- `published_at`: When article was published
- `created_at`: When we cached it

#### User Preferences Table

Stores user customization preferences.

```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    theme VARCHAR(50) DEFAULT 'light',
    background_type VARCHAR(50) DEFAULT 'image',
    show_news BOOLEAN DEFAULT true,
    show_sponsors BOOLEAN DEFAULT true,
    show_history BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `user_id`: FK to users table (NULL uses defaults)
- `theme`: 'light', 'dark', or 'auto'
- `background_type': 'image' or 'video'
- `show_news`, `show_sponsors`, `show_history`: Visibility toggles
- `created_at`, `updated_at`: Timestamps

## Verification Checklist

After completing Phase 1:

- [ ] NX CLI installed locally (`pnpm list nx`)
- [ ] `/nx.json` created with proper configuration
- [ ] Root `/package.json` created with workspace scripts
- [ ] `/pnpm-workspace.yaml` created with correct package patterns
- [ ] `/tsconfig.base.json` created with shared TypeScript config
- [ ] Frontend apps moved to `/apps/fe/`
- [ ] Backend directory structure created at `/apps/be/`
- [ ] `/libs/shared/` directory created
- [ ] `/nginx/` and `/docker/` directories created
- [ ] Database schema documented (actual tables created in Phase 2)

## Next Steps

Proceed to [Phase 2: Backend Implementation](./02-backend-implementation.md)
