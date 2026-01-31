# Docker Environment Setup

This directory contains the Docker Compose configuration for running the microservice infrastructure.

## Services

- **postgres**: PostgreSQL 15 database on port 5432
- **auth-be**: Authentication service on port 8081
- **nginx**: Reverse proxy on port 80

**Note**: The `newtab-be` service runs separately on localhost:8082 (not in Docker)

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `newtab` |
| `POSTGRES_USER` | Database user | `newtab` |
| `POSTGRES_PASSWORD` | Database password | `newtab` |
| `JWT_SECRET` | JWT secret key (min 256 bits) | Change in production |
| `POSTGRES_URL_AUTH` | Auth service DB URL | `jdbc:postgresql://postgres:5432/newtab?reWriteBatchedInserts=true` |
| `POSTGRES_URL_NEWTAB` | Newtab service DB URL | `jdbc:postgresql://localhost:5432/newtab` |
| `POSTGRES_PORT` | PostgreSQL exposed port | `5432` |
| `AUTH_BE_PORT` | Auth service exposed port | `8081` |
| `NGINX_PORT` | Nginx exposed port | `80` |

## Usage

### Start Docker services

```bash
make dev
# or
docker-compose up -d
```

### Stop Docker services

```bash
make stop
# or
docker-compose down
```

### View logs

```bash
docker-compose logs -f
```

### Restart a specific service

```bash
docker-compose restart auth-be
```

## Running newtab-be (External Service)

The newtab-be service runs outside Docker:

```bash
cd ../apps/be/newtab-service
./mvnw spring-boot:run
```

Ensure the service is running on localhost:8082 before starting Docker services.

## API Endpoints via Nginx

When services are running, access APIs through nginx at `http://localhost`:

- Auth API: `http://localhost/api/auth/*` → auth-be (Docker)
- News API: `http://localhost/api/news/*` → newtab-be (localhost:8082)
- History API: `http://localhost/api/history/*` → newtab-be (localhost:8082)
- Sponsors API: `http://localhost/api/sponsors/*` → newtab-be (localhost:8082)
- Preferences API: `http://localhost/api/preferences/*` → newtab-be (localhost:8082)

## Health Checks

Services include health checks that depend on their dependencies:
- `postgres`: Database readiness
- `auth-be`: API endpoint `/api/auth/validate`

Services will not start until their dependencies are healthy.

## Networks

All services are connected to the `app-network` bridge network for internal communication.

## Volumes

- `postgres_data`: Persistent PostgreSQL data storage
