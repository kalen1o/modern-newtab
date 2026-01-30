# NewTab Service

Main NewTab service for search history, sponsors, and news articles built with Spring Boot 3.2.

## Technology Stack
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven
- Java 21

## Features
- Search history management
- Sponsor CRUD and random rotation
- News article caching and retrieval
- User preferences management
- Background job ready for news fetching

## Configuration

Port: 8082

Database: PostgreSQL (newtab)

## API Endpoints

### Search History

- `POST /api/history` - Save search history
  - Body: `{ "userId": integer, "query": "string" }`

- `GET /api/history/{userId}` - Get user's search history

- `DELETE /api/history/{id}` - Delete search history entry

### Sponsors

- `POST /api/sponsors` - Create sponsor
  - Body: `{ "name": "string", "type": "image|video", "mediaUrl": "string", "linkUrl": "string?", "isActive": boolean }`

- `GET /api/sponsors/random` - Get random active sponsor

- `GET /api/sponsors` - Get all active sponsors

- `PUT /api/sponsors/{id}` - Update sponsor

- `DELETE /api/sponsors/{id}` - Delete sponsor

### News Articles

- `GET /api/news` - Get recent news articles (top 20)

- `POST /api/news` - Save news article
  - Body: `{ "title": "string", "description": "string?", "url": "string", "source": "string?", "publishedAt": "timestamp?" }`

- `DELETE /api/news/{id}` - Delete news article

### User Preferences

- `GET /api/preferences/{userId}` - Get user preferences

- `PUT /api/preferences` - Update user preferences
  - Body: `{ "userId": integer, "theme": "string?", "backgroundType": "string?", "showNews": boolean?, "showSponsors": boolean?, "showHistory": boolean? }`

## Running the Service

```bash
# Ensure PostgreSQL is running
# Ensure auth-service is running (for users table reference)

cd apps/be/newtab-service
mvn spring-boot:run
```

## Database Schema

Migrations are automatically applied via Flyway.

See `src/main/resources/db/migration/` for schema:
- `V1__Create_main_tables.sql` - Main tables (search_history, sponsors, news_articles, user_preferences)
- `V2__Ensure_users_table.sql` - Ensures users table exists (managed by auth-service)

## Sponsor Rotation

The service implements random sponsor rotation strategy. Call `GET /api/sponsors/random` to get a randomly selected active sponsor.

## User Preferences Defaults

When preferences are requested for a user that doesn't have them set:
- theme: light
- backgroundType: image
- showNews: true
- showSponsors: true
- showHistory: true
