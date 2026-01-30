# Auth Service

Authentication service for NewTab application built with Spring Boot 3.2.

## Technology Stack
- Spring Boot 3.2.0
- Spring Security 6.x
- Spring Data JPA
- JWT (io.jsonwebtoken:jjwt 0.12.3)
- PostgreSQL
- Flyway
- Maven
- Java 21

## Features
- User registration and login
- Guest token generation
- JWT token validation
- Password hashing with BCrypt
- Token refresh endpoint
- Interactive API documentation with Swagger UI

## Configuration

Port: 8081

Database: PostgreSQL (newtab)

## API Documentation

Interactive API documentation is available at:
- **Swagger UI**: http://localhost:8081/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8081/v3/api-docs

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  - Body: `{ "email": "string", "password": "string" }`

- `POST /api/auth/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

- `POST /api/auth/guest` - Get guest token (no authentication required)

- `POST /api/auth/refresh` - Refresh JWT token
  - Header: `Authorization: Bearer <token>`

- `GET /api/auth/validate` - Validate JWT token
  - Header: `Authorization: Bearer <token>`

## Running the Service

```bash
# Ensure PostgreSQL is running
# Set JWT_SECRET environment variable (recommended)
export JWT_SECRET=your-super-secret-key-change-this-in-production-min-256-bits

# Run with Maven
cd apps/be/auth-service
mvn spring-boot:run
```

## Testing

```bash
# Register
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Guest token
curl -X POST http://localhost:8081/api/auth/guest

# Validate token
curl -X GET http://localhost:8081/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

Migrations are automatically applied via Flyway.

See `src/main/resources/db/migration/V1__Create_users_table.sql` for schema.
