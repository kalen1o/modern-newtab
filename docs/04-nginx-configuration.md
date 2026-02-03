# Phase 4: Nginx Configuration

## Overview

This phase covers configuring Nginx as a reverse proxy for routing requests and implementing authentication middleware using the `auth_request` module.

## Architecture

Nginx serves as the single entry point:
- Routes API requests to backend services
- Validates JWT tokens using `auth_request` module
- Handles guest access
- Forwards authenticated user information to downstream services
- Handles CORS headers

## 4.1 Nginx Setup

### Directory Structure

```
docker/
├── nginx.conf
├── Dockerfile
└── .env.example
```

### Current Implementation

**File:** `/docker/nginx.conf`

The nginx configuration now implements:

1. **Auth Request Authentication** - Validates JWT tokens at the gateway level
2. **Header Forwarding** - Passes user information (email, userType) to backend services
3. **Route-based Authentication** - Different auth rules for different routes

```nginx
events {
    worker_connections 1024;
}

http {
    resolver 127.0.0.11 ipv4=on valid=10s;

    # Map allowed origins to prevent CORS duplication
    map $http_origin $cors_origin {
        default "";
        "http://localhost:5173" $http_origin;
        "http://localhost:5174" $http_origin;
        "http://localhost:5175" $http_origin;
    }

    # Upstream for auth service
    upstream auth-be {
        server auth-be:8081;
    }

    # Upstream for newtab service
    upstream newtab-be {
        server host.docker.internal:8082;
    }

    server {
        listen 80;
        server_name localhost;

        client_max_body_size 10M;

        # Health check endpoint (no auth required)
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Auth endpoints (no auth required, allow guest)
        location /api/auth/ {
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $cors_origin;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Access-Control-Allow-Credentials' 'true';
                return 204;
            }

            proxy_pass http://auth-be/api/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Credentials';

            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        }

        # Protected API endpoints - require auth via nginx auth_request
        location /api/ {
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' $cors_origin;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
                add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
                add_header 'Access-Control-Max-Age' 86400;
                add_header 'Access-Control-Allow-Credentials' 'true';
                return 204;
            }

            # Validate JWT token using nginx auth_request
            auth_request /internal/auth;

            # Capture user information from auth service response headers
            auth_request_set $user_email $upstream_http_x_user_email;
            auth_request_set $user_type $upstream_http_x_user_type;

            # Pass to newtab service
            set $backend "http://newtab-be";
            proxy_pass $backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Forward user information to downstream service
            proxy_set_header X-User-Email $user_email;
            proxy_set_header X-User-Type $user_type;

            # Handle CORS headers
            proxy_hide_header 'Access-Control-Allow-Origin';
            proxy_hide_header 'Access-Control-Allow-Credentials';

            add_header 'Access-Control-Allow-Origin' $cors_origin always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            # Handle auth errors
            error_page 401 = @error401;
        }

        # Internal auth validation endpoint (only accessible from nginx)
        location = /internal/auth {
            internal;
            proxy_pass http://auth-be/api/auth/validate;
            proxy_pass_request_body off;
            proxy_set_header Content-Length "";
            proxy_set_header Authorization $http_authorization;
        }

        # Error handling for 401 unauthorized
        location @error401 {
            return 401 '{"error": "Unauthorized", "message": "Invalid or missing token"}';
            add_header Content-Type application/json;
            add_header 'Access-Control-Allow-Origin' $cors_origin always;
        }
    }
}
```

## 4.2 Authentication Middleware with auth_request

### How It Works

Nginx uses `auth_request` module to validate JWT tokens at the gateway level:

1. Request comes in to protected endpoint (`/api/*`)
2. Nginx makes sub-request to `/internal/auth` before forwarding
3. Auth service validates token from Authorization header
4. If valid, returns 200 and sets headers with user information
5. Nginx captures user info from headers and forwards to backend service
6. If invalid, returns 401 and request is blocked

### Flow Diagram

```
Client Request
    │
    ├── /api/auth/*  ───► Auth Service (No validation needed)
    │
    ├── /api/* (other) ──► Nginx auth_request
    │                           │
    │                           ├── /internal/auth
    │                           │               │
    │                           │               ▼
    │                           │        Auth Service /api/auth/validate
    │                           │               │
    │                           │          Valid (200) + Headers
    │                           │               │
    │                           │         Extract X-User-Email
    │                           │         Extract X-User-Type
    │                           │               │
    │                           │         Forward to NewTab Service
    │                           │         with user headers
    │                           │
    │                           └── Invalid (401) ──► Return 401
    │
    └── /health ──────────────► Return 200 OK (no auth)
```

### Auth Service Validation Endpoint

The auth service's validate endpoint now returns user information in response headers:

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java`

```java
@GetMapping("/validate")
public ResponseEntity<ValidateResponse> validate(
        @RequestHeader("Authorization") String authHeader,
        HttpServletResponse response) {
    String token = authHeader.replace("Bearer ", "");
    ValidateResponse validateResponse = authService.validateToken(token);

    // Set user information in response headers for nginx auth_request
    // These headers will be passed to downstream services
    response.setHeader("X-User-Email", validateResponse.getEmail());
    response.setHeader("X-User-Type", validateResponse.getUserType());

    return ResponseEntity.ok(validateResponse);
}
```

### Backend Service Configuration

NewTab service trusts headers set by nginx (since nginx already validated the token):

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/newtab/config/SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final HeaderAuthenticationFilter headerAuthenticationFilter;

    public SecurityConfig(HeaderAuthenticationFilter headerAuthenticationFilter) {
        this.headerAuthenticationFilter = headerAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .anyRequest().permitAll())  // nginx handles auth
                .addFilterBefore(headerAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

**Header Authentication Filter** - Reads user information from nginx headers:

```java
@Component
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_EMAIL = "X-User-Email";
    private static final String HEADER_USER_TYPE = "X-User-Type";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String userEmail = request.getHeader(HEADER_USER_EMAIL);
        String userType = request.getHeader(HEADER_USER_TYPE);

        // If nginx has authenticated the request, set the SecurityContext
        if (userEmail != null && userType != null) {
            UserPrincipal principal = new UserPrincipal(userEmail, userType);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
```

### Guest Access Handling

Guest access is handled by:
1. `/api/auth/guest` endpoint creates guest token without user record
2. Frontend stores token and includes in all requests
3. Protected endpoints validate token (guest or authenticated) at nginx level
4. Backend can distinguish guest vs registered users by email format or userType header

## 4.3 Route Configuration Summary

| Route Pattern | Destination | Auth Required |
|--------------|-------------|---------------|
| `/api/auth/*` | auth-service:8081 | No |
| `/api/auth/guest` | auth-service:8081 | No |
| `/api/health` | Nginx returns OK | No |
| `/api/*` (other) | newtab-service:8082 | Yes (nginx auth_request) |

## 4.4 CORS Configuration

CORS is configured to allow cross-origin requests:
- Map allowed origins for localhost development ports (5173, 5174, 5175)
- Allow common HTTP methods
- Allow Authorization and Content-Type headers
- Support credentials

For production, restrict to specific origins:

```nginx
map $http_origin $cors_origin {
    default "";
    "https://yourdomain.com" $http_origin;
}
```

## 4.5 Benefits of nginx-level Authentication

1. **Centralized Validation** - Single point of JWT validation
2. **Reduced Backend Load** - Invalid requests blocked at gateway
3. **Consistent Security** - All services benefit from gateway-level auth
4. **Easier Auditing** - Authentication decisions made at gateway
5. **Simplified Backend Services** - Services trust nginx headers, no JWT validation needed
6. **Flexible Routing** - Can add new services without modifying auth logic

## 4.6 SSL/TLS Configuration (Future Enhancement)

For production HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... same configuration as HTTP
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 4.7 Caching Strategy (Future Enhancement)

### Static Assets

```nginx
location /assets/ {
    proxy_pass http://newtab-shell;
    proxy_cache_valid 200 7d;
    add_header Cache-Control "public, immutable";
}
```

Caches build assets for 7 days since they have hash-based filenames.

### API Responses

```nginx
# No caching for API responses
location /api/ {
    proxy_no_cache 1;
    proxy_cache_bypass 1;
    add_header Cache-Control "no-store, no-cache";
}
```

## Verification Checklist

After implementing nginx auth_request:

- [x] nginx.conf created with auth_request for `/api/*`
- [x] Internal auth endpoint (`/internal/auth`) configured
- [x] Auth endpoints (`/api/auth/*`) bypass validation
- [x] CORS headers configured
- [x] User headers forwarded to downstream services
- [x] Auth service returns X-User-Email and X-User-Type headers
- [x] HeaderAuthenticationFilter created in newtab-service
- [x] JwtAuthenticationFilter removed from newtab-service
- [x] Error handling for 401 responses
- [ ] Testing in running environment

## Testing

### Test Auth Request Flow

```bash
# 1. Get a guest token
TOKEN=$(curl -s -X POST http://localhost/api/auth/guest | jq -r '.token')

# 2. Test protected endpoint with valid token
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/history

# 3. Test protected endpoint without token (should return 401)
curl http://localhost/api/history

# 4. Test protected endpoint with invalid token (should return 401)
curl -H "Authorization: Bearer invalid-token" http://localhost/api/history

# 5. Test auth endpoint (no auth required)
curl -X POST http://localhost/api/auth/guest

# 6. Test health endpoint (no auth required)
curl http://localhost/health
```

### Verify Headers are Forwarded

```bash
# Create a debug endpoint in newtab-service that logs headers
# Request should include X-User-Email and X-User-Type headers
curl -v -H "Authorization: Bearer $TOKEN" http://localhost/api/debug
```

## Troubleshooting

### 502 Bad Gateway

Check if upstream services are running:
```bash
docker ps
curl http://localhost:8081/health  # auth-service
curl http://localhost:8082/health  # newtab-service
```

### 401 Unauthorized on Valid Token

Check if Authorization header is forwarded correctly:
```bash
curl -v -H "Authorization: Bearer $TOKEN" http://localhost/api/history
# Look for "Authorization: Bearer" in request headers
```

Verify auth-service validate endpoint is working:
```bash
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/auth/validate
```

Check if X-User-Email and X-User-Type headers are returned:
```bash
# Should see these in response headers
curl -I -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/auth/validate
```

### User Information Not Available in Backend

Verify nginx is forwarding headers:
```bash
# Add logging to nginx to see headers
# Check that $user_email and $user_type variables are set
```

Check HeaderAuthenticationFilter is registered:
```bash
# Verify filter is in Spring Security filter chain
# Check application logs for filter initialization
```

### CORS Errors

Verify CORS headers in response:
```bash
curl -I -H "Origin: http://localhost:5173" http://localhost/api/history
```

## Comparison: Before vs After

### Before (Backend-level Auth)
- Each service validates JWT tokens independently
- `JwtAuthenticationFilter` in each service
- Duplicate validation logic
- Invalid requests reach backend services
- Each service needs JWT provider

### After (Gateway-level Auth)
- Single validation point at nginx
- Services trust headers from nginx
- No JWT validation in services
- Invalid requests blocked at gateway
- Services only need `HeaderAuthenticationFilter`
- Centralized security control

## Next Steps

- [ ] Test authentication flow in running environment
- [ ] Add integration tests for auth_request flow
- [ ] Consider adding rate limiting
- [ ] Add request/response logging
- [ ] Implement SSL/TLS for production
- [ ] Add health checks for auth service dependency
