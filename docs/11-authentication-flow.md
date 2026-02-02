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
   - Generates JWT token with:
     - Subject: user email
     - Claim: `userType: "registered"`
     - Expiration: 24 hours (configurable)
   - Returns `AuthResponse` with token, refreshToken (same token), and userType
6. **Frontend** receives response and stores tokens in localStorage:
   - `authToken`: JWT token
   - `refreshToken`: Same token (simplified implementation)
   - `userType`: "registered"
7. **useAuth hook** updates state: `isAuthenticated = true`, `isRegistered = true`

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:37-41`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:26-39`

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
   - If valid, generates JWT token with email and `userType: "registered"`
   - Returns `AuthResponse`
6. **Frontend** stores tokens in localStorage and updates authentication state

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:31-35`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:41-51`

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
     │                   │                       │ (guest-{timestamp}@guest.newtab)
     │                   │                       │
     │                   │                       │ Generate JWT
     │                   │                       │ (email, "guest")
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
   - Generates unique guest email: `guest-{timestamp}@guest.newtab`
   - Creates JWT token with guest email and `userType: "guest"`
   - **No user record created in database**
   - Returns `AuthResponse`
6. **Frontend** stores tokens and sets `isRegistered = false`

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:25-29`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java:58-62`

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
┌─────────┐         ┌──────────┐         ┌──────────────┐         ┌─────────────┐
│ Browser │         │  Nginx   │         │ NewTab Service│        │ Auth Service│
└────┬────┘         └────┬─────┘         └──────┬───────┘         └──────┬──────┘
     │                   │                       │                        │
     │ GET /api/search   │                       │                        │
     │ Authorization:    │                       │                        │
     │ Bearer {token}    │                       │                        │
     ├──────────────────>│                       │                        │
     │                   │                       │                        │
     │                   │ GET /api/search       │                        │
     │                   │ Authorization: Bearer │                        │
     │                   ├──────────────────────>│                        │
     │                   │                       │                        │
     │                   │                       │ JwtAuthenticationFilter│
     │                   │                       │ intercepts request      │
     │                   │                       │                        │
     │                   │                       │ Extract token          │
     │                   │                       │ Validate signature     │
     │                   │                       │ Extract email & userType│
     │                   │                       │                        │
     │                   │                       │ Create Authentication  │
     │                   │                       │ Set SecurityContext    │
     │                   │                       │                        │
     │                   │                       │ Process request        │
     │                   │                       │                        │
     │                   │                       │ Response               │
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
3. **Nginx** routes `/api/*` requests to newtab-service (port 8082)
4. **JwtAuthenticationFilter** (`apps/be/newtab-service/src/main/java/com/newtab/newtab/security/JwtAuthenticationFilter.java`) intercepts request:
   - Extracts token from Authorization header
   - Validates token using `JwtProvider.validateToken()`
   - Extracts email and userType from token claims
   - Creates `UserPrincipal` with email and userType
   - Creates `UsernamePasswordAuthenticationToken` with `ROLE_USER` authority
   - Sets authentication in Spring Security context
5. **Controller** processes request with authenticated user context
6. **Response** returned to frontend

**Code References:**
- Frontend API Client: `libs/shared/src/api.ts:22-44`
- Backend Filter: `apps/be/newtab-service/src/main/java/com/newtab/newtab/security/JwtAuthenticationFilter.java:26-54`

---

### 6. Token Refresh Flow

```
┌─────────┐         ┌──────────┐         ┌─────────────┐
│ Browser │         │  Nginx   │         │ Auth Service│
└────┬────┘         └────┬─────┘         └──────┬──────┘
     │                   │                       │
     │ POST /api/auth/   │                       │
     │ refresh           │                       │
     │ Authorization:    │                       │
     │ Bearer {token}    │                       │
     ├──────────────────>│                       │
     │                   │                       │
     │                   │ POST /api/auth/       │
     │                   │ refresh               │
     │                   ├──────────────────────>│
     │                   │                       │
     │                   │                       │ Extract token
     │                   │                       │ Validate token
     │                   │                       │ Extract email
     │                   │                       │
     │                   │                       │ Generate new JWT
     │                   │                       │ (same email, userType)
     │                   │                       │
     │                   │                       │ AuthResponse
     │                   │<──────────────────────┤
     │                   │                       │
     │ AuthResponse      │                       │
     │ {newToken, ...}   │                       │
     │<──────────────────┤                       │
     │                   │                       │
     │ Update localStorage│                      │
     │                   │                       │
```

**Step-by-Step Process:**

1. **Frontend** calls `authService.refreshToken()` when token is about to expire
2. **Request** sent to `/api/auth/refresh` with current token in Authorization header
3. **AuthController** extracts token and validates it
4. **AuthService**:
   - Validates existing token
   - Extracts email from token
   - Generates new JWT token with same email and userType
   - Returns new `AuthResponse`
5. **Frontend** updates localStorage with new tokens

**Code References:**
- Frontend: `apps/fe/newtab/src/api/auth.ts:43-51`
- Backend: `apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java:60-73`

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

### Token Claims

```json
{
  "sub": "user@example.com",
  "userType": "registered",
  "iat": 1234567890,
  "exp": 1234654290
}
```

- **sub** (subject): User's email address
- **userType**: Either "registered" or "guest"
- **iat** (issued at): Timestamp when token was created
- **exp** (expiration): Timestamp when token expires (24 hours from iat)

### Token Generation

Tokens are signed using HMAC-SHA256 with a secret key configured in `application.yml`:

```yaml
jwt:
  secret: ${JWT_SECRET:your-super-secret-key-change-this-in-production-min-256-bits}
  expiration: 86400000  # 24 hours in milliseconds
```

**Code Reference:** `apps/be/auth-service/src/main/java/com/newtab/auth/security/JwtProvider.java:36-47`

---

## Security Configuration

### Auth Service Security

The auth-service allows public access to all `/api/auth/**` endpoints:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()
    .anyRequest().authenticated())
```

**Code Reference:** `apps/be/auth-service/src/main/java/com/newtab/auth/config/SecurityConfig.java:18-19`

### NewTab Service Security

The newtab-service requires authentication for all endpoints except health checks:

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/health/**").permitAll()
    .anyRequest().authenticated())
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```

**Code Reference:** `apps/be/newtab-service/src/main/java/com/newtab/newtab/config/SecurityConfig.java:31-38`

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

- **Key**: `authToken` - JWT access token
- **Key**: `refreshToken` - Currently same as access token (simplified)
- **Key**: `userType` - Either "guest" or "registered"

**Code Reference:** `apps/fe/newtab/src/api/auth.ts:61-65`

### Backend Storage (PostgreSQL)

- **Table**: `users`
- **Columns**: `id`, `email`, `password_hash`, `created_at`
- **Migration**: `V1__Create_users_table.sql`

**Note**: Guest users are not stored in the database - they only exist as JWT tokens.

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
4. **Token validation** on app load and API requests
5. **Secure password storage** using BCrypt hashing
6. **Microservice architecture** with separate auth and resource services
7. **CORS support** for cross-origin requests

All authentication flows are designed to be secure, scalable, and user-friendly while maintaining separation of concerns between frontend and backend services.
