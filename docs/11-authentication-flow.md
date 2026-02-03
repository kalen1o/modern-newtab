# Authentication Flow Documentation

## Overview

The NewTab application uses a JWT-based authentication system with three authentication paths:
1. **User Registration** - Creates new user accounts
2. **User Login** - Authenticates existing users
3. **Guest Access** - Provides temporary access without registration

The system consists of:
- **Frontend**: React application with authentication hooks and API client
- **Backend**: Spring Boot microservices (auth-service for authentication, newtab-service for protected resources)
- **Infrastructure**: Nginx reverse proxy routing requests to appropriate services
- **Storage**: JWT tokens stored in browser localStorage

---

## Architecture Components

### Frontend Components

1. **AuthService** (`apps/fe/newtab/src/api/auth.ts`)
   - Handles API calls to authentication endpoints
   - Manages token storage in localStorage
   - Provides token retrieval and validation methods

2. **useAuth Hook** (`apps/fe/newtab/src/hooks/useAuth.ts`)
   - React hook managing authentication state
   - Provides login, logout, and guest token functions
   - Validates tokens on application load

3. **API Client** (`libs/shared/src/api.ts`)
   - Automatically attaches JWT tokens to API requests
   - Handles Authorization header injection
   - Centralized request/response handling

### Backend Components

1. **Auth Service** (`apps/be/auth-service`)
   - Handles registration, login, guest token generation
   - Token validation and refresh endpoints
   - User repository and password hashing

2. **NewTab Service** (`apps/be/newtab-service`)
   - Protected resource service
   - JWT authentication filter for request validation
   - Extracts user information from tokens

3. **JWT Provider** (both services)
   - Token generation with HMAC-SHA256 signing
   - Token validation and claims extraction
   - Configurable expiration (24 hours default)

### Infrastructure

1. **Nginx** (`docker/nginx.conf`)
   - Routes `/api/auth/*` to auth-service (port 8081)
   - Routes `/api/*` to newtab-service (port 8082)
   - Handles CORS headers
   - **Validates JWT tokens using `auth_request`** for all `/api/*` endpoints (except `/api/auth/*`)
   - Forwards user information (email, userType) to downstream services via headers

---

## Authentication Flows

### 1. User Registration Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│         │  PostgreSQL  │
└────┬────┘         └────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                   │                       │                       │
     │ POST /api/auth/   │                       │                       │
     │ register          │                       │                       │
     │ {email, password} │                       │                       │
     ├──────────────────>│                       │                       │
     │                   │                       │                       │
     │                   │ POST /api/auth/       │                       │
     │                   │ register              │                       │
     │                   ├──────────────────────>│                       │
     │                   │                       │                       │
     │                   │                       │ Check email exists    │
     │                   │                       ├───────────────────────>│
     │                   │                       │<───────────────────────┤
     │                   │                       │                       │
     │                   │                       │ Hash password         │
     │                   │                       │ (BCrypt)              │
     │                   │                       │                       │
     │                   │                       │ Save user             │
     │                   │                       ├───────────────────────>│
     │                   │                       │<───────────────────────┤
     │                   │                       │                       │
     │                   │                       │ Generate JWT          │
     │                   │                       │ (email, userType)      │
     │                   │                       │                       │
     │                   │                       │ AuthResponse          │
     │                   │<──────────────────────┤                       │
     │                   │                       │                       │
     │ AuthResponse      │                       │                       │
     │ {token,           │                       │                       │
     │  refreshToken,    │                       │                       │
     │  userType}        │                       │                       │
     │<──────────────────┤                       │                       │
     │                   │                       │                       │
     │ Store in          │                       │                       │
     │ localStorage      │                       │                       │
     │                   │                       │                       │
```

**Step-by-Step Process:**

1. **User submits registration form** with email and password
2. **Frontend** calls `authService.register()` which sends POST to `/api/auth/register`
3. **Nginx** routes request to auth-service (port 8081)
4. **AuthController** receives request and calls `AuthService.register()`
5. **AuthService**:
   - Checks if email already exists in database
   - Hashes password using BCryptPasswordEncoder
   - Creates new User entity and saves to PostgreSQL
   - Generates access token with:
     - Subject: user email
     - Claim: `userType: "registered"`
     - Expiration: 1 minute (configurable)
   - Generates refresh token with:
     - Subject: user email
     - Claim: `userType: "registered"`
     - Claim: `type: "refresh"`
     - Expiration: 7 days
   - Stores refresh token in database
   - Returns `AuthResponse` with token, refreshToken, and userType
6. **Frontend** receives response and stores tokens in localStorage:
   - `authToken`: Access token (1 min expiry)
   - `refreshToken`: Refresh token (7 day expiry)
   - `userType`: "registered"
7. **useAuth hook** updates state: `isAuthenticated = true`, `isRegistered = true`

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:37-41`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:28-41`

---

### 2. User Login Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│         │  PostgreSQL  │
└────┬────┘         └────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                   │                       │                       │
     │ POST /api/auth/   │                       │                       │
     │ login             │                       │                       │
     │ {email, password} │                       │                       │
     ├──────────────────>│                       │                       │
     │                   │                       │                       │
     │                   │ POST /api/auth/       │                       │
     │                   │ login                 │                       │
     │                   ├──────────────────────>│                       │
     │                   │                       │                       │
     │                   │                       │ Find user by email     │
     │                   │                       ├───────────────────────>│
     │                   │                       │<───────────────────────┤
     │                   │                       │                       │
     │                   │                       │ Verify password        │
     │                   │                       │ (BCrypt.matches)        │
     │                   │                       │                       │
     │                   │                       │ Generate JWT          │
     │                   │                       │ (email, "registered")  │
     │                   │                       │                       │
     │                   │                       │ AuthResponse          │
     │                   │<──────────────────────┤                       │
     │                   │                       │                       │
     │ AuthResponse      │                       │                       │
     │ {token,           │                       │                       │
     │  refreshToken,    │                       │                       │
     │  userType}        │                       │                       │
     │<──────────────────┤                       │                       │
     │                   │                       │                       │
     │ Store in          │                       │                       │
     │ localStorage      │                       │                       │
     │                   │                       │                       │
```

**Step-by-Step Process:**

1. **User submits login form** with email and password
2. **Frontend** calls `authService.login()` which sends POST to `/api/auth/login`
3. **Nginx** routes request to auth-service
4. **AuthController** receives request and calls `AuthService.login()`
5. **AuthService**:
   - Retrieves user from database by email
   - Verifies password using `BCryptPasswordEncoder.matches()`
   - If credentials invalid, throws RuntimeException
   - If valid, generates access token with email and `userType: "registered"` (1 min expiry)
   - Generates refresh token with email, `userType: "registered"`, and `type: "refresh"` (7 day expiry)
   - Stores refresh token in database
   - Returns `AuthResponse` with both tokens
6. **Frontend** stores tokens in localStorage and updates authentication state

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:31-35`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:43-55`

---

### 3. Guest Token Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│
└────┬────┘         └────┬─────┘         └──────┬──────┘
     │                   │                       │
     │ POST /api/auth/   │                       │
     │ guest             │                       │
     ├──────────────────>│                       │
     │                   │                       │
     │                   │ POST /api/auth/       │
     │                   │ guest                 │
     │                   ├──────────────────────>│
     │                   │                       │
     │                   │                       │ Generate guest email
     │                   │                       │ (guest-{uuid}@guest.newtab)
     │                   │                       │
     │                   │                       │ Generate access token
     │                   │                       │ (email, "guest", 1 min)
     │                   │                       │
     │                   │                       │ Generate refresh token
     │                   │                       │ (email, "guest", 7 days)
     │                   │                       │
     │                   │                       │ Store refresh token
     │                   │                       │ in database
     │                   │                       │
     │                   │                       │ AuthResponse
     │                   │<──────────────────────┤
     │                   │                       │
     │ AuthResponse      │                       │
     │ {token,           │                       │
     │  refreshToken,    │                       │
     │  userType: "guest"}│                      │
     │<──────────────────┤                       │
     │                   │                       │
     │ Store in          │                       │
     │ localStorage      │                       │
     │                   │                       │
```

**Step-by-Step Process:**

1. **User clicks "Continue as Guest"** or app automatically requests guest token
2. **Frontend** calls `authService.getGuestToken()` which sends POST to `/api/auth/guest`
3. **Nginx** routes request to auth-service
4. **AuthController** receives request and calls `AuthService.guestToken()`
5. **AuthService**:
   - Generates unique guest email: `guest-{uuid}@guest.newtab`
   - Creates access token with guest email and `userType: "guest"` (1 min expiry)
   - Creates refresh token with guest email, `userType: "guest"`, and `type: "refresh"` (7 day expiry)
   - Stores refresh token in database
   - **No user record created in database**
   - Returns `AuthResponse` with both tokens
6. **Frontend** stores tokens and sets `isRegistered = false`

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:25-29`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:117-122`

---

### 4. Token Validation on App Load

```
┌─────────┐         ┌──────────┐         ┌─────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│
└────┬────┘         └────┬─────┘         └──────┬──────┘
     │                   │                       │
     │ App loads         │                       │
     │                   │                       │
     │ Check localStorage│                       │
     │ for token         │                       │
     │                   │                       │
     │ GET /api/auth/    │                       │
     │ validate          │                       │
     │ Authorization:    │                       │
     │ Bearer {token}    │                       │
     ├──────────────────>│                       │
     │                   │                       │
     │                   │ GET /api/auth/        │
     │                   │ validate              │
     │                   ├──────────────────────>│
     │                   │                       │
     │                   │                       │ Extract token from header
     │                   │                       │ Validate JWT signature
     │                   │                       │ Check expiration
     │                   │                       │ Extract email
     │                   │                       │
     │                   │                       │ Return email
     │                   │<──────────────────────┤
     │                   │                       │
     │ Email string      │                       │
     │<──────────────────┤                       │
     │                   │                       │
     │ Update auth state │                       │
     │                   │                       │
```

**Step-by-Step Process:**

1. **Application initializes** - `useAuth` hook runs `useEffect` on mount
2. **Check localStorage** for existing token via `authService.isAuthenticated()`
3. **If token exists**, call `authService.validateToken()`:
   - Sends GET request to `/api/auth/validate`
   - Includes `Authorization: Bearer {token}` header
4. **AuthController** receives request:
   - Extracts token from Authorization header
   - Calls `AuthService.validateToken()`
5. **AuthService**:
   - Validates token signature and expiration using `JwtProvider.validateToken()`
   - Extracts email from token
   - Returns email if valid, throws exception if invalid
6. **Frontend**:
   - If validation succeeds: sets `isAuthenticated = true`, checks `userType` for `isRegistered`
   - If validation fails: clears localStorage, sets `isAuthenticated = false`

**Code References:**
- Frontend: `apps/fe/newtab/src/hooks/useAuth.ts:11-32`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java:75-87`

---

### 5. Protected API Request Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│         │ NewTab Service│
└────┬────┘         └────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                   │                       │                        │
     │ GET /api/search   │                       │                        │
     │ Authorization:    │                       │                        │
     │ Bearer {token}    │                       │                        │
     ├──────────────────>│                       │                        │
     │                   │                       │                        │
     │                   │ Internal auth_request │                        │
     │                   │ /internal/auth        │                        │
     │                   │ Authorization: Bearer │                        │
     │                   ├──────────────────────>│                        │
     │                   │                       │                        │
     │                   │ Extract token         │                        │
     │                   │ Validate signature    │                        │
     │                   │ Extract email & userType                      │
     │                   │                       │                        │
     │                   │ 200 OK                │                        │
     │                   │ X-User-Email: ...     │                        │
     │                   │ X-User-Type: ...      │                        │
     │                   │<──────────────────────┤                        │
     │                   │                       │                        │
     │                   │ GET /api/search       │                        │
     │                   │ X-User-Email: ...     │                        │
     │                   │ X-User-Type: ...      │                        │
     │                   ├──────────────────────>│                        │
     │                   │                       │ HeaderAuthFilter       │
     │                   │                       │ reads headers         │
     │                   │                       │                        │
     │                   │                       │ Set SecurityContext   │
     │                   │                       │                        │
     │                   │                       │ Process request       │
     │                   │                       │                        │
     │                   │ Response               │                        │
     │                   │<──────────────────────┤                        │
     │                   │                       │                        │
     │ Response          │                       │                        │
     │<──────────────────┤                       │                        │
     │                   │                       │                        │
```

**Step-by-Step Process:**

1. **Frontend makes API call** (e.g., search history, news)
2. **API Client** (`libs/shared/src/api.ts`) automatically:
   - Retrieves token from localStorage
   - Adds `Authorization: Bearer {token}` header to request
3. **Nginx** intercepts `/api/*` requests:
   - Makes internal `auth_request` to `/internal/auth`
   - Forwards Authorization header to auth-service
4. **Auth Service** validates token at `/api/auth/validate`:
   - Extracts token from Authorization header
   - Validates token using `JwtProvider.validateToken()`
   - Extracts email and userType from token claims
   - Returns 200 OK with headers: `X-User-Email` and `X-User-Type`
5. **Nginx** receives validation response:
   - If invalid/missing (401), returns 401 to client immediately
   - If valid (200), forwards request to newtab-service
   - Forwards `X-User-Email` and `X-User-Type` headers to backend
6. **NewTab Service** receives request:
   - `HeaderAuthenticationFilter` reads `X-User-Email` and `X-User-Type` headers
   - Creates `UserPrincipal` with email and userType
   - Creates `UsernamePasswordAuthenticationToken` with `ROLE_USER` authority
   - Sets authentication in Spring Security context
7. **Controller** processes request with authenticated user context
8. **Response** returned to frontend

**Code References:**
- Frontend API Client: `libs/shared/src/api.ts:22-44`
- Nginx Config: `docker/nginx.conf:68-99`
- Auth Service Validate: `apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java:83-108`
- Header Auth Filter: `apps/be/newtab-service/src/main/java/com/newtab/newtab/security/HeaderAuthenticationFilter.java`

---

### 6. Token Refresh Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐         ┌──────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│         │  PostgreSQL  │
└────┬────┘         └────┬─────┘         └──────┬──────┘         └──────┬───────┘
     │                   │                       │                       │
     │ POST /api/auth/   │                       │                       │
     │ refresh           │                       │                       │
     │ {refreshToken}    │                       │                       │
     ├──────────────────>│                       │                       │
     │                   │                       │                       │
     │                   │ POST /api/auth/       │                       │
     │                   │ refresh               │                       │
     │                   ├──────────────────────>│                       │
     │                   │                       │                       │
     │                   │                       │ Validate refresh token
     │                   │                       │ Check if expired       │
     │                   │                       │                       │
     │                   │                       │ Find stored token     │
     │                   │                       ├───────────────────────>│
     │                   │                       │<───────────────────────┤
     │                   │                       │                       │
     │                   │                       │ Generate new access   │
     │                   │                       │ token (15 min expiry) │
     │                   │                       │ Generate new refresh   │
     │                   │                       │ token (7 day expiry)   │
     │                   │                       │                       │
     │                   │                       │ Delete old refresh     │
     │                   │                       │ token                 │
     │                   │                       ├───────────────────────>│
     │                   │                       │                       │
     │                   │                       │ Store new refresh      │
     │                   │                       │ token                 │
     │                   │                       ├───────────────────────>│
     │                   │                       │                       │
     │                   │                       │ AuthResponse          │
     │                   │<──────────────────────┤                       │
     │                   │                       │                       │
     │ AuthResponse      │                       │                       │
     │ {newToken,        │                       │                       │
     │  newRefreshToken} │                       │                       │
     │<──────────────────┤                       │                       │
     │                   │                       │                       │
     │ Update localStorage│                      │                       │
     │                   │                       │                       │
```

**Step-by-Step Process:**

1. **Frontend** calls `authService.refreshToken()` when access token is about to expire
2. **Request** sent to `/api/auth/refresh` with `refreshToken` in request body
3. **AuthController** receives refresh token
4. **AuthService**:
   - Validates refresh token signature
   - Checks if it's a refresh token (not access token)
   - Verifies token is not expired and exists in database
   - Extracts email and userType
   - Generates new access token (1-minute expiry)
   - Generates new refresh token (7-day expiry)
   - Deletes old refresh token from database
   - Stores new refresh token in database
   - Returns new `AuthResponse` with both tokens
5. **Frontend** updates localStorage with new tokens

**Key Differences from Access Tokens:**
- **Access Token**: Short-lived (1 minute), used for API calls
- **Refresh Token**: Long-lived (7 days), stored in database, used to get new access tokens
- **Token Rotation**: Old refresh token is invalidated when generating new one
- **Security**: Refresh tokens have `type: "refresh"` claim to distinguish from access tokens

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:45-53`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java:76-84`
- Backend Service: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:91-115`
- JWT Provider: `apps/be/auth-service/src/main/java/com/newtab/auth/security/JwtProvider.java:79-93`

---

### 7. Logout Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ User clicks logout
     │
     │ Clear localStorage
     │ - authToken
     │ - refreshToken
     │ - userType
     │
     │ Update React state
     │ - isAuthenticated = false
     │ - isRegistered = false
     │ - token = null
     │
     │ (No server call needed)
     │
```

**Step-by-Step Process:**

1. **User clicks logout** button
2. **Frontend** calls `authService.logout()`:
   - Removes `authToken`, `refreshToken`, and `userType` from localStorage
3. **useAuth hook** updates state:
   - `isAuthenticated = false`
   - `isRegistered = false`
   - `token = null`
4. **No server-side call** - tokens are stateless JWTs, so logout is purely client-side

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:84-88`
- Frontend Hook: `apps/fe/newtab/src/hooks/useAuth.ts:70-76`

---

## JWT Token Structure

### Access Token Claims

```json
{
  "sub": "user@example.com",
  "userType": "registered",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Access Token Claims:**
- **sub** (subject): User's email address
- **userType**: Either "registered" or "guest"
- **iat** (issued at): Timestamp when token was created
- **exp** (expiration): Timestamp when token expires (1 minute from iat)

### Refresh Token Claims

```json
{
  "sub": "user@example.com",
  "userType": "registered",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Refresh Token Claims:**
- **sub** (subject): User's email address
- **userType**: Either "registered" or "guest"
- **type**: Always "refresh" to distinguish from access tokens
- **iat** (issued at): Timestamp when token was created
- **exp** (expiration): Timestamp when token expires (7 days from iat)

### Token Generation

Tokens are signed using HMAC-SHA256 with a secret key configured in `application.yml`:

```yaml
jwt:
  secret: ${JWT_SECRET:your-super-secret-key-change-this-in-production-min-256-bits}
  expiration: 60000  # 1 minute in milliseconds (access token) - for testing
  refresh-expiration: 604800000  # 7 days in milliseconds (refresh token)
```

**Token Differences:**

| Property | Access Token | Refresh Token |
|----------|--------------|---------------|
| Purpose | API authentication | Token refresh |
| Expiration | 1 minute | 7 days |
| Storage | localStorage | localStorage + database |
| Contains `type: "refresh"` | No | Yes |
| Used in Authorization header | Yes | No |

**Code References:**
- JWT Provider: `apps/be/auth-service/src/main/java/com/newtab/auth/security/JwtProvider.java:36-93`
- Refresh Token Entity: `apps/be/auth-service/src/main/java/com/newtab/auth/entity/RefreshToken.java`
- Refresh Token Repository: `apps/be/auth-service/src/main/java/com/newtab/auth/repository/RefreshTokenRepository.java`

---

## Security Configuration

### Auth Service Security

The auth-service allows public access to all `/api/auth/**` endpoints:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .requestMatchers("/api/health/**").permitAll()
    .requestMatchers("/actuator/health").permitAll()
    .requestMatchers("/swagger-ui/**").permitAll()
    .requestMatchers("/swagger-ui.html").permitAll()
    .requestMatchers("/v3/api-docs/**").permitAll()
    .anyRequest().authenticated())
```

**Code Reference:** `apps/be/auth-service/src/main/java/com/newtab/auth/config/SecurityConfig.java:23-30`

### NewTab Service Security

The newtab-service uses **nginx-level authentication**:
- Nginx validates JWT tokens before requests reach the service
- All requests are permitted at the Spring Security level
- `HeaderAuthenticationFilter` reads user information from headers set by nginx

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/health/**").permitAll()
    .requestMatchers("/actuator/health").permitAll()
    .requestMatchers("/swagger-ui/**").permitAll()
    .requestMatchers("/swagger-ui.html").permitAll()
    .requestMatchers("/v3/api-docs/**").permitAll()
    .anyRequest().permitAll())  // nginx handles auth
.addFilterBefore(headerAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```

**Code Reference:** `apps/be/newtab-service/src/main/java/com/newtab/newtab/config/SecurityConfig.java:31-40`

### Nginx Authentication

Nginx provides the authentication layer using `auth_request`:

```nginx
location /api/ {
    # Validate JWT token using nginx auth_request
    auth_request /internal/auth;

    # Capture user information from auth service response headers
    auth_request_set $user_email $upstream_http_x_user_email;
    auth_request_set $user_type $upstream_http_x_user_type;

    # Forward user information to downstream service
    proxy_set_header X-User-Email $user_email;
    proxy_set_header X-User-Type $user_type;

    # Handle auth errors
    error_page 401 = @error401;
}
```

**Code Reference:** `docker/nginx.conf:70-99`

---

## Error Handling

### Invalid Credentials

- **Backend**: Throws `RuntimeException("Invalid credentials")`
- **Frontend**: Catches error, displays message, does not update auth state

### Invalid/Expired Token

- **Backend**: `JwtProvider.validateToken()` returns `false` or throws `JwtException`
- **Frontend**: Clears localStorage, sets `isAuthenticated = false`

### Token Validation Failure

- **On app load**: Token cleared, user redirected to login/guest flow
- **On API request**: 401 Unauthorized response, frontend handles accordingly

---

## Storage Details

### Frontend Storage (localStorage)

- **Key**: `authToken` - JWT access token (1 min expiry)
- **Key**: `refreshToken` - JWT refresh token (7 day expiry)
- **Key**: `userType` - Either "guest" or "registered"
- **Key**: `userEmail` - User's email address

**Code Reference:** `apps/fe/newtab/src/api/auth.ts:66-73`

### Backend Storage (PostgreSQL)

All database tables are managed by **newtab-service** through Flyway migrations located at:
- `apps/be/newtab-service/src/main/resources/db/migration/`

- **Table**: `users`
  - `id` (UUID)
  - `email` (unique, indexed)
  - `password_hash` (BCrypt hashed)
  - `created_at`
  - `updated_at`

- **Table**: `refresh_tokens`
  - `id` (auto-increment BIGSERIAL)
  - `token` (unique JWT string, indexed)
  - `user_id` (email or guest identifier, indexed)
  - `user_type` ("guest" or "registered")
  - `expiry_date` (timestamp, indexed)
  - `created_at`

**Code References:**
- User Entity: `apps/be/auth-service/src/main/java/com/newtab/auth/entity/User.java`
- Refresh Token Entity: `apps/be/auth-service/src/main/java/com/newtab/auth/entity/RefreshToken.java`
- User Repository: `apps/be/auth-service/src/main/java/com/newtab/auth/repository/UserRepository.java`
- Refresh Token Repository: `apps/be/auth-service/src/main/java/com/newtab/auth/repository/RefreshTokenRepository.java`
- Migration Script: `apps/be/newtab-service/src/main/resources/db/migration/V1__Create_all_tables.sql`

**Note**: Guest users are not stored in the `users` table - they only exist as JWT tokens. However, their refresh tokens ARE stored in the `refresh_tokens` table for proper token management.

---

## CORS Configuration

Nginx handles CORS headers for all authentication endpoints:

```nginx
add_header 'Access-Control-Allow-Origin' $cors_origin always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
```

**Code Reference:** `docker/nginx.conf:44-47`

---

## Summary

The authentication system provides:

1. **Stateless authentication** using JWT tokens
2. **Three access paths**: Registration, Login, Guest access
3. **Automatic token injection** in API requests
4. **Token validation at nginx gateway** using `auth_request` module
5. **Secure password storage** using BCrypt hashing
6. **Microservice architecture** with separate auth and resource services
7. **CORS support** for cross-origin requests
8. **Centralized authentication** - nginx validates tokens before requests reach backend services
9. **Header-based user context** - nginx forwards user information via headers to downstream services

**Key Architecture Changes:**
- Authentication moved from backend filters to nginx gateway
- `HeaderAuthenticationFilter` replaces `JwtAuthenticationFilter` in newtab-service
- Auth service `validate` endpoint now returns user information in response headers
- All `/api/*` endpoints (except `/api/auth/*`) are protected by nginx auth_request

All authentication flows are designed to be secure, scalable, and user-friendly while maintaining separation of concerns between frontend, gateway, and backend services.
