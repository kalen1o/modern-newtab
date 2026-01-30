# Phase 4: Nginx Configuration

## Overview

This phase covers configuring Nginx as a reverse proxy for routing requests and implementing authentication middleware.

## Architecture

Nginx serves as the single entry point:
- Routes API requests to backend services
- Routes frontend requests to appropriate FE app
- Validates JWT tokens
- Handles guest access
- Serves static files

## 4.1 Nginx Setup

### Directory Structure

```
nginx/
├── nginx.conf
├── Dockerfile
└── ssl/ (optional, for HTTPS)
```

### Step 1: Create nginx.conf

**File:** `/nginx/nginx.conf`

```nginx
# Main Nginx configuration for NewTab application

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Upstream for auth service
    upstream auth_service {
        server auth-service:8081;
    }

    # Upstream for newtab service
    upstream newtab_service {
        server newtab-service:8082;
    }

    # Upstream for newtab shell
    upstream newtab_shell {
        server newtab-shell:5173;
    }

    # Upstream for autocomplete module
    upstream autocomplete_module {
        server autocomplete:5001;
    }

    # Upstream for sponsor admin
    upstream sponsor_admin {
        server sponsor-admin:5174;
    }

    # Auth request for JWT validation
    server {
        listen 8089;
        server_name localhost;

        location /api/auth/validate {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Main server
    server {
        listen 80;
        server_name localhost;

        # Allow CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Auth endpoints (no auth required, allow guest)
        location /api/auth/ {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Guest endpoint (no auth required)
        location /api/auth/guest {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints - require auth
        location /api/ {
            # Validate JWT token
            auth_request /internal/auth;

            # Pass auth response headers
            auth_request_set $user_email $upstream_http_x_user_email;

            proxy_pass http://newtab_service;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-User-Email $user_email;

            # Handle auth errors
            error_page 401 = @error401;
        }

        # Internal auth validation endpoint
        location = /internal/auth {
            internal;
            proxy_pass http://auth_service/api/auth/validate;
            proxy_pass_request_body off;
            proxy_set_header Content-Length "";
            proxy_set_header Authorization $http_authorization;
        }

        # Autocomplete remote entry
        location /assets/remoteEntry.js {
            proxy_pass http://autocomplete_module;
            proxy_cache_bypass $http_upgrade;
        }

        # Admin interface
        location /admin {
            # Validate JWT token
            auth_request /internal/auth;

            # Check if user is admin (optional, requires admin role check)
            # auth_request_set $user_role $upstream_http_x_user_role;

            proxy_pass http://sponsor_admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Handle auth errors
            error_page 401 = @error401;
        }

        # Static assets for FE apps
        location /assets/ {
            proxy_pass http://newtab_shell;
            proxy_cache_valid 200 7d;
            add_header Cache-Control "public, immutable";
        }

        # NewTab shell (default, allow guest)
        location / {
            proxy_pass http://newtab_shell;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support for Vite HMR (development only)
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Error handling
        location @error401 {
            return 401 '{"error": "Unauthorized", "message": "Invalid or missing token"}';
            add_header Content-Type application/json;
        }

        # Error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
    }
}
```

### Step 2: Create Dockerfile

**File:** `/nginx/Dockerfile`

```dockerfile
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directory
RUN mkdir -p /var/log/nginx

# Expose port
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 4.2 Authentication Middleware

### How It Works

Nginx uses `auth_request` module to validate JWT tokens:

1. Request comes in to protected endpoint
2. Nginx makes sub-request to `/internal/auth`
3. Auth service validates token from Authorization header
4. If valid, returns 200 and passes through to destination
5. If invalid, returns 401 and request is denied

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
    │                           │          Valid (200) ──► NewTab Service
    │                           │
    │                           └── Invalid (401) ──► Return 401
    │
    └── /admin ──────────────► Nginx auth_request
                                  │
                                  └── Same validation flow
```

### Enhanced Auth Service (Updated)

Update auth service to return user email in response headers:

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java` (update validate endpoint)

```java
@GetMapping("/validate")
public ResponseEntity<String> validate(
    @RequestHeader("Authorization") String authHeader,
    HttpServletResponse response
) {
    String token = authHeader.replace("Bearer ", "");
    String email = authService.validateToken(token);

    // Set user email in response header for Nginx to pass to downstream
    response.setHeader("X-User-Email", email);

    return ResponseEntity.ok(email);
}
```

### Guest Access Handling

Guest access is handled by:
1. `/api/auth/guest` endpoint creates guest token without user
2. Frontend stores token and includes in all requests
3. Protected endpoints validate token (guest or authenticated)
4. Backend can distinguish guest vs authenticated users by email format

## 4.3 Route Configuration Summary

| Route Pattern | Destination | Auth Required |
|--------------|-------------|---------------|
| `/api/auth/*` | auth-service:8081 | No |
| `/api/auth/guest` | auth-service:8081 | No |
| `/api/history/*` | newtab-service:8082 | Yes |
| `/api/sponsors/*` | newtab-service:8082 | Yes |
| `/api/news/*` | newtab-service:8082 | Yes |
| `/api/preferences/*` | newtab-service:8082 | Yes |
| `/admin/*` | sponsor-admin:5174 | Yes |
| `/` | newtab-shell:5173 | No (guest allowed) |
| `/assets/remoteEntry.js` | autocomplete:5001 | No |

## 4.4 CORS Configuration

CORS is configured to allow cross-origin requests:
- Allow all origins (`*`)
- Allow common HTTP methods
- Allow Authorization and Content-Type headers

For production, restrict to specific origins:

```nginx
add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
```

## 4.5 SSL/TLS Configuration (Optional)

For production HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 4.6 Caching Strategy

### Static Assets

```nginx
location /assets/ {
    proxy_pass http://newtab_shell;
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

After completing Phase 4:

- [ ] nginx.conf created with all upstreams
- [ ] Auth request configured for protected endpoints
- [ ] Guest endpoints bypass auth
- [ ] CORS headers configured
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] Dockerfile created
- [ ] Auth service returns X-User-Email header
- [ ] Error handling for 401 responses

## Testing

### Start Nginx

```bash
# Using Docker
cd nginx
docker build -t newtab-nginx .
docker run -p 80:80 -p 443:443 newtab-nginx

# Using docker-compose (preferred)
docker-compose up nginx
```

### Test Routes

```bash
# Test health endpoint
curl http://localhost/health

# Test auth endpoint (no auth required)
curl -X POST http://localhost/api/auth/guest

# Test protected endpoint (should fail without token)
curl http://localhost/api/history

# Test protected endpoint with token
TOKEN=$(curl -s -X POST http://localhost/api/auth/guest | jq -r '.token')
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/history

# Test FE app
curl http://localhost/
```

## Troubleshooting

### 502 Bad Gateway

Check if upstream services are running:
```bash
docker ps
curl http://auth-service:8081/health
curl http://newtab-service:8082/health
```

### 401 Unauthorized

Check Authorization header format:
```bash
# Correct
Authorization: Bearer <token>

# Wrong
Authorization: <token>
```

### CORS Errors

Verify CORS headers in response:
```bash
curl -I http://localhost/api/history
```

### WebSocket Issues (HMR)

If hot module reload doesn't work in development:
- Check proxy WebSocket upgrade headers
- Verify Vite runs on correct port
- Check browser console for WebSocket errors

## Next Steps

Proceed to [Phase 5: Docker & Orchestration](./05-docker-orchestration.md)
