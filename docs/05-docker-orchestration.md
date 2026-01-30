# Phase 5: Docker & Orchestration

## Overview

This phase covers containerizing all services and orchestrating them with Docker Compose.

## 5.1 Docker Compose Setup

### Architecture

Docker Compose manages all services:
- PostgreSQL database
- Auth service (Spring Boot)
- Newtab service (Spring Boot)
- Newtab shell (React)
- Autocomplete module (React)
- Sponsor admin (React)
- Nginx (reverse proxy)

### Directory Structure

```
docker/
├── docker-compose.yml
├── docker-compose.dev.yml (optional, for development)
└── docker-compose.prod.yml (optional, for production)
```

### Step 1: Create docker-compose.yml

**File:** `/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: newtab-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: newtab
      POSTGRES_USER: newtab
      POSTGRES_PASSWORD: newtab_password
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U newtab"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - newtab-network

  # Authentication Service
  auth-service:
    build:
      context: ../apps/be/auth-service
      dockerfile: Dockerfile
    container_name: newtab-auth-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/newtab
      SPRING_DATASOURCE_USERNAME: newtab
      SPRING_DATASOURCE_PASSWORD: newtab_password
      JWT_SECRET: ${JWT_SECRET:your-super-secret-key-change-this-in-production-min-256-bits}
      JWT_EXPIRATION: 86400000
      SERVER_PORT: 8081
    ports:
      - "8081:8081"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - newtab-network

  # NewTab Service
  newtab-service:
    build:
      context: ../apps/be/newtab-service
      dockerfile: Dockerfile
    container_name: newtab-service
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/newtab
      SPRING_DATASOURCE_USERNAME: newtab
      SPRING_DATASOURCE_PASSWORD: newtab_password
      SERVER_PORT: 8082
      SPRING_FLYWAY_ENABLED: true
    ports:
      - "8082:8082"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8082/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - newtab-network

  # NewTab Shell (React)
  newtab-shell:
    build:
      context: ../apps/fe/newtab
      dockerfile: Dockerfile
    container_name: newtab-shell
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://nginx
      VITE_AUTH_API_URL: http://nginx
    depends_on:
      - nginx
    networks:
      - newtab-network

  # Autocomplete Module (React)
  autocomplete:
    build:
      context: ../apps/fe/autocomplete-input
      dockerfile: Dockerfile
    container_name: autocomplete-module
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      VITE_API_BASE_URL: http://nginx
    depends_on:
      - nginx
    networks:
      - newtab-network

  # Sponsor Admin (React)
  sponsor-admin:
    build:
      context: ../apps/fe/sponsor-admin
      dockerfile: Dockerfile
    container_name: sponsor-admin
    restart: unless-stopped
    ports:
      - "5174:5174"
    environment:
      VITE_API_BASE_URL: http://nginx
      VITE_AUTH_API_URL: http://nginx
    depends_on:
      - nginx
    networks:
      - newtab-network

  # Nginx Reverse Proxy
  nginx:
    build:
      context: ../nginx
      dockerfile: Dockerfile
    container_name: newtab-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      auth-service:
        condition: service_healthy
      newtab-service:
        condition: service_healthy
      newtab-shell:
        condition: service_started
      autocomplete:
        condition: service_started
      sponsor-admin:
        condition: service_started
    networks:
      - newtab-network
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro

volumes:
  postgres_data:
    driver: local

networks:
  newtab-network:
    driver: bridge
```

## 5.2 Dockerfiles

### Auth Service Dockerfile

**File:** `/apps/be/auth-service/Dockerfile`

```dockerfile
# Multi-stage build for Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/auth-service-*.jar app.jar

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### NewTab Service Dockerfile

**File:** `/apps/be/newtab-service/Dockerfile`

```dockerfile
# Multi-stage build for Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/newtab-service-*.jar app.jar

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8082/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### React App Dockerfile (Generic for all FE apps)

**File:** `/apps/fe/newtab/Dockerfile`

```dockerfile
# Multi-stage build for React + Vite
FROM node:21-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@latest && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copy build artifacts
COPY --from=builder /app/dist .

# Copy custom nginx config for SPA
RUN echo 'server { listen 5173; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**File:** `/apps/fe/autocomplete-input/Dockerfile`

Same as newtab Dockerfile but with different port if needed.

**File:** `/apps/fe/sponsor-admin/Dockerfile`

Same as newtab Dockerfile but with port 5174.

## 5.3 Environment Variables

### .env File

**File:** `/.env` (not committed to git)

```bash
# Database
POSTGRES_DB=newtab
POSTGRES_USER=newtab
POSTGRES_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production

# Server Ports (optional, override defaults)
NGINX_PORT=80
AUTH_SERVICE_PORT=8081
NEWTAB_SERVICE_PORT=8082
SHELL_PORT=5173
AUTOCOMPLETE_PORT=5001
ADMIN_PORT=5174
```

### .env.example

**File:** `/.env.example`

```bash
# Database
POSTGRES_DB=newtab
POSTGRES_USER=newtab
POSTGRES_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production
```

## 5.4 Docker Compose Profiles

### Development Profile

**File:** `/docker/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  # Override for development with hot reload
  newtab-shell:
    volumes:
      - ../apps/fe/newtab:/app:ro
      - /app/node_modules

  autocomplete:
    volumes:
      - ../apps/fe/autocomplete-input:/app:ro
      - /app/node_modules

  sponsor-admin:
    volumes:
      - ../apps/fe/sponsor-admin:/app:ro
      - /app/node_modules
```

### Production Profile

**File:** `/docker/docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
      - SSL_KEY_PATH=/etc/nginx/ssl/key.pem

  postgres:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

## 5.5 Container Health Checks

### What Are Health Checks?

Health checks monitor service health:
- `interval`: How often to check
- `timeout`: How long to wait for response
- `retries`: How many failures before marking unhealthy
- `start_period`: Grace period before checks start

### Spring Boot Actuator

Add to both Spring Boot services:

**File:** `/apps/be/auth-service/src/main/resources/application.yml`

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
```

## 5.6 Volume Management

### PostgreSQL Data Volume

```yaml
volumes:
  postgres_data:
    driver: local
```

Named volume persists database data across container restarts.

### Shared Volumes (Optional)

For logs or shared assets:

```yaml
volumes:
  logs:
    driver: local
  static_assets:
    driver: local

services:
  # Mount volume to service
  newtab-service:
    volumes:
      - logs:/app/logs
```

## 5.7 Network Configuration

### Bridge Network

```yaml
networks:
  newtab-network:
    driver: bridge
```

All services communicate via bridge network using service names as hostnames:
- `postgres`
- `auth-service`
- `newtab-service`
- `nginx`
- etc.

## 5.8 Scaling Services

### Horizontal Scaling

```bash
# Scale stateless services
docker-compose up -d --scale newtab-service=3 --scale auth-service=2
```

Note: Stateful services (PostgreSQL) cannot be scaled this way.

### Load Balancing

Nginx automatically load balances between scaled instances:
```nginx
upstream newtab_service {
    server newtab-service:8082;
    # Additional instances will be added automatically
}
```

## 5.9 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 newtab-service
```

### Log Aggregation (Optional)

Add centralized logging:
```yaml
services:
  newtab-service:
    logging:
      driver: "syslog"
      options:
        syslog-address: "tcp://logstash:5000"
```

### Metrics

Expose metrics with Spring Boot Actuator:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
```

## Verification Checklist

After completing Phase 5:

- [ ] docker-compose.yml created with all services
- [ ] All Dockerfiles created
- [ ] .env.example created
- [ ] Health checks configured for all services
- [ ] Networks configured
- [ ] Volumes configured for database
- [ ] Services can communicate via DNS
- [ ] Images build successfully
- [ ] Containers start without errors
- [ ] All services become healthy

## Usage

### Start All Services

```bash
# Start all services
docker-compose up -d

# Build and start (first time or after changes)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Development Mode

```bash
# Use development profile
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production Mode

```bash
# Use production profile
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Individual Service Management

```bash
# Start specific service
docker-compose up -d auth-service

# Restart specific service
docker-compose restart newtab-service

# Stop specific service
docker-compose stop nginx

# View specific service logs
docker-compose logs -f newtab-shell
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs service-name
```

Common issues:
- Port already in use: Change port mapping in docker-compose.yml
- Database connection error: Ensure postgres is healthy
- Out of memory: Increase Docker memory limit

### Health Check Failing

Check health endpoint manually:
```bash
docker exec -it auth-service curl -f http://localhost:8081/actuator/health
```

### Volume Issues

List volumes:
```bash
docker volume ls
```

Inspect volume:
```bash
docker volume inspect newtab_postgres_data
```

### Network Issues

List networks:
```bash
docker network ls
```

Inspect network:
```bash
docker network inspect microservice_newtab-network
```

### Rebuild After Changes

```bash
# Force rebuild
docker-compose build --no-cache service-name

# Remove old images
docker-compose down --rmi all
```

## Best Practices

1. **Never commit sensitive data**: Use `.env` file and add to `.gitignore`
2. **Use health checks**: Ensure services are ready before starting dependent services
3. **Limit resource usage**: Add resource constraints to docker-compose.yml
4. **Use specific versions**: Pin image versions for reproducibility
5. **Clean up regularly**: Remove unused images and volumes
6. **Use multi-stage builds**: Reduce final image size
7. **Run as non-root**: Security best practice
8. **Log rotation**: Prevent disk space issues
9. **Backup volumes**: Regularly backup PostgreSQL data volume
10. **Use secrets management**: For production, use Docker secrets or vault

## Next Steps

Proceed to [Phase 6: Implementation Details](./06-implementation-details.md)
