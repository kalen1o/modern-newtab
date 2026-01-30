# Phase 9: Security Considerations

## Overview

This phase covers security best practices, common vulnerabilities, and how to protect against them.

## 9.1 JWT Token Management

### Token Expiration

**Implementation:**

```java
// AuthApplication.java - application.yml
jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24 hours
  refresh-expiration: 604800000  # 7 days
```

**Best Practices:**

- Use short-lived access tokens (15-30 minutes for production)
- Use longer-lived refresh tokens (7-30 days)
- Rotate refresh tokens after use
- Implement token revocation for compromised tokens

### Token Storage on Client

**Local Storage (Current - NOT Recommended):**

```typescript
// Don't do this:
localStorage.setItem('token', jwtToken)
```

**Issues:**
- Vulnerable to XSS attacks
- Accessible by any JavaScript on the page

**Cookie Storage (Recommended):**

```typescript
// Set httpOnly, secure cookie
document.cookie = `token=${jwtToken}; Path=/; HttpOnly; Secure; SameSite=Strict`
```

**Benefits:**
- Protected from XSS (httpOnly)
- Only sent over HTTPS (secure)
- CSRF protection (SameSite)
- Automatic handling by browser

### Token Revocation

**Backend Implementation:**

**Add revoked_tokens table:**

```sql
CREATE TABLE revoked_tokens (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(255) UNIQUE NOT NULL,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_revoked_tokens_id ON revoked_tokens(token_id);
```

**Service:**

```java
@Service
public class TokenRevocationService {

    private final RevokedTokenRepository repository;

    public void revokeToken(String tokenId) {
        RevokedToken revoked = new RevokedToken();
        revoked.setTokenId(tokenId);
        revoked.setExpiresAt(LocalDateTime.now().plusDays(7));
        repository.save(revoked);
    }

    public boolean isTokenRevoked(String tokenId) {
        // Clean up expired tokens
        repository.deleteExpiredTokens(LocalDateTime.now());

        return repository.existsByTokenId(tokenId);
    }
}
```

**Validation:**

```java
// In JwtProvider.java
public boolean validateToken(String token) {
    try {
        String tokenId = extractTokenId(token);

        // Check if revoked
        if (tokenRevocationService.isTokenRevoked(tokenId)) {
            return false;
        }

        // ... existing validation
        return true;
    } catch (JwtException | IllegalArgumentException ex) {
        return false;
    }
}
```

### Refresh Token Flow

```
Client Request (Expired Access Token)
    │
    ├── Access Token Expired
    │
    ├── Use Refresh Token
    │
    ├── POST /api/auth/refresh
    │   Body: { refreshToken: "..." }
    │
    ├── Validate Refresh Token
    │
    ├── Generate New Access Token
    │
    └── Return New Access Token
        └── Revoke Old Refresh Token
```

## 9.2 Password Hashing

### BCrypt Implementation

**Current Implementation:**

```java
@Service
public class AuthService {

    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public AuthResponse register(RegisterRequest request) {
        User user = new User();
        user.setEmail(request.getEmail());
        // Hash password with BCrypt
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        // ...
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Verify password hash
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        // ...
    }
}
```

### BCrypt Security Features

1. **Automatic Salt**: Each password gets unique salt
2. **Work Factor**: Configurable computational cost (default 10)
3. **Adaptive**: Can increase work factor over time as hardware improves

### Password Requirements

**Validation:**

```java
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 12, max = 128, message = "Password must be 12-128 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",
             message = "Password must contain uppercase, lowercase, number, and special character")
    private String password;
}
```

### Password Reset Flow

```
User Requests Reset
    │
    ├── Generate Reset Token
    │
    ├── Send Email with Reset Link
    │   /reset-password?token=xxx
    │
    ├── User Submits New Password
    │
    ├── Validate Reset Token (expires in 1 hour)
    │
    ├── Hash New Password
    │
    └── Update Password in Database
```

## 9.3 CORS Configuration

### Backend CORS

**Current Implementation:**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())  // Nginx handles CORS
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### Production CORS

**Update for specific origins:**

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(List.of("https://yourdomain.com"));
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

### Nginx CORS

**Current (Development):**

```nginx
add_header 'Access-Control-Allow-Origin' '*' always;
```

**Production:**

```nginx
# Allow only specific origins
add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;

# Allow methods
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;

# Allow headers
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

# Allow credentials
add_header 'Access-Control-Allow-Credentials' 'true' always;

# Cache preflight requests
add_header 'Access-Control-Max-Age' '3600' always;
```

## 9.4 SQL Injection Prevention

### JPA Parameterized Queries

**Vulnerable (Don't do this):**

```java
// DON'T DO THIS!
@Query("SELECT u FROM User u WHERE u.email = '" + email + "'")
List<User> findByEmail(String email);
```

**Safe (Use this):**

```java
// DO THIS
public interface UserRepository extends JpaRepository<User, Long> {
    // JPA automatically parameterizes
    Optional<User> findByEmail(String email);

    // Or use @Query with parameters
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
}
```

### Named Parameters

**Example:**

```java
@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    @Query("SELECT h FROM SearchHistory h WHERE h.userId = :userId AND h.query LIKE %:query%")
    List<SearchHistory> findByUserIdAndQueryContaining(
        @Param("userId") Long userId,
        @Param("query") String query
    );
}
```

### Input Validation

**Validate before database query:**

```java
public List<SearchHistory> searchHistory(Long userId, String query) {
    // Sanitize query
    if (query == null || query.trim().isEmpty()) {
        return List.of();
    }

    // Limit length
    if (query.length() > 500) {
        query = query.substring(0, 500);
    }

    return repository.findByUserIdAndQueryContaining(userId, query);
}
```

## 9.5 XSS Prevention

### React Built-in Protection

React automatically escapes JSX content:

```typescript
// Safe - React escapes
<div>{userInput}</div>

// Safe - React escapes
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

### When to Sanitize

**Only with dangerouslySetInnerHTML:**

```typescript
import DOMPurify from 'dompurify'

// Sanitize before rendering
const clean = DOMPurify.sanitize(dirtyHtml)

// Then render
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

**Never render unsanitized:**

```typescript
// DON'T DO THIS!
<div dangerouslySetInnerHTML={{ __html: userProvidedHtml }} />
```

### Content Security Policy (CSP)

**Nginx Configuration:**

```nginx
# Add CSP header
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.example.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
" always;
```

## 9.6 Rate Limiting

### Nginx Rate Limiting

```nginx
# Limit login attempts
http {
    # Rate limit zone
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    server {
        # Apply to login endpoint
        location /api/auth/login {
            limit_req zone=login burst=10 nodelay;

            proxy_pass http://auth_service;
        }

        # Apply to all API endpoints
        location /api/ {
            limit_req zone=api:10m rate=60r/m;

            proxy_pass http://newtab_service;
        }
    }
}
```

### Backend Rate Limiting

**Using Spring Boot + Bucket4j:**

**Dependency:**

```xml
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```

**Implementation:**

```java
@Configuration
public class RateLimitConfig {

    @Bean
    public BandwidthManager bandwidthManager() {
        return BandwidthManagerClassic
            .builder()
            .addBandwidth(Bandwidth.simple(100, Duration.ofMinutes(1)))  // 100 requests per minute
            .build();
    }
}

@RestController
@RequestMapping("/api")
public class ApiRateLimitedController {

    private final BandwidthManager bandwidthManager;

    @GetMapping("/data")
    public ResponseEntity<?> getData(@RequestHeader("X-User-Email") String email) {
        Bucket bucket = bandwidthManager.resolve(email);

        // Try to consume 1 token
        if (bucket.tryConsume(1)) {
            return ResponseEntity.ok(data);
        } else {
            return ResponseEntity.status(429)
                .header("X-Rate-Limit-Limit", "100")
                .header("X-Rate-Limit-Remaining", bucket.getAvailableTokens())
                .body("Rate limit exceeded");
        }
    }
}
```

## 9.7 Admin-Only Endpoint Protection

### Role-Based Access Control

**Add role to User entity:**

```java
@Entity
@Table(name = "users")
public class User {
    // ... existing fields

    @Column(name = "role")
    private String role = "USER";  // USER, ADMIN
}
```

**Security configuration:**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtProvider jwtProvider) {
        return new JwtAuthenticationFilter(jwtProvider);
    }
}
```

**JWT Authentication Filter:**

```java
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtProvider.getEmailFromToken(token);

            // Get user and set authentication
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        getAuthorities(user.getRole())
                    );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }

    private Collection<? extends GrantedAuthority> getAuthorities(String role) {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
```

### Admin Endpoints Annotation

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    // All methods require ADMIN role
}
```

## 9.8 Security Headers

### Nginx Security Headers

```nginx
# HSTS (Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# X-Frame-Options (Clickjacking protection)
add_header X-Frame-Options "DENY" always;

# X-Content-Type-Options (MIME sniffing protection)
add_header X-Content-Type-Options "nosniff" always;

# X-XSS-Protection (XSS filter)
add_header X-XSS-Protection "1; mode=block" always;

# Referrer-Policy (Privacy)
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions-Policy (Feature control)
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Backend Security Headers

```java
@Configuration
public class SecurityHeaderConfig {

    @Bean
    public WebMvcConfigurer webMvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(new SecurityHeaderInterceptor());
            }
        };
    }
}

public class SecurityHeaderInterceptor implements HandlerInterceptor {

    @Override
    public void postHandle(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler
    ) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
    }
}
```

## 9.9 HTTPS/TLS

### Certificate Setup

**Using Let's Encrypt:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d yourdomain.com
```

**Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL session cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Forward Secrecy

**Nginx Configuration:**

```nginx
# Forward Secrecy header
add_header X-Forwarded-Proto $scheme always;
add_header X-Forwarded-Host $host always;
add_header X-Forwarded-For $proxy_add_x_forwarded_for always;
```

## 9.10 Security Monitoring

### Logging

**Security Events to Log:**

```java
@Service
public class SecurityAuditService {

    private final Logger logger = LoggerFactory.getLogger(SecurityAuditService.class);

    public void logLoginSuccess(String email, String ip) {
        logger.info("LOGIN_SUCCESS | email: {} | ip: {}", email, ip);
    }

    public void logLoginFailure(String email, String ip) {
        logger.warn("LOGIN_FAILURE | email: {} | ip: {}", email, ip);
    }

    public void logRateLimitExceeded(String email, String ip) {
        logger.error("RATE_LIMIT | email: {} | ip: {}", email, ip);
    }

    public void logUnauthorizedAccess(String endpoint, String ip) {
        logger.error("UNAUTHORIZED | endpoint: {} | ip: {}", endpoint, ip);
    }

    public void logAdminAction(String admin, String action) {
        logger.info("ADMIN_ACTION | admin: {} | action: {}", admin, action);
    }
}
```

### Intrusion Detection

**Monitor for:**

1. **Brute Force Attacks**
   - Multiple failed logins from same IP
   - Multiple failed logins for same account

2. **Rate Limit Violations**
   - Excessive API calls from single IP
   - Unusual access patterns

3. **SQL Injection Attempts**
   - Malicious query patterns in logs
   - Error messages indicating SQL errors

4. **XSS Attempts**
   - Script tags in input fields
   - Suspicious HTML in requests

### Alerts

**Setup Alerting:**

```yaml
# Example: Prometheus alerting
groups:
  - name: security
    rules:
      - alert: HighRateOfFailedLogins
        expr: rate(failed_logins_total[5m]) > 10
        for: 5m
        annotations:
          summary: "High rate of failed login attempts"
      - alert: UnauthorizedAccessAttempts
        expr: rate(unauthorized_access_total[1m]) > 50
        for: 1m
        annotations:
          summary: "High rate of unauthorized access attempts"
```

## 9.11 Security Checklist

### Before Production

- [ ] All secrets stored in environment variables (not in code)
- [ ] JWT secrets are at least 256 bits
- [ ] Passwords hashed with BCrypt (work factor >= 10)
- [ ] HTTPS enabled on all endpoints
- [ ] HSTS header configured
- [ ] CORS restricted to specific origins
- [ ] CSP header configured
- [ ] Rate limiting enabled on public endpoints
- [ ] SQL injection protection in place (parameterized queries)
- [ ] XSS protection enabled (React + CSP)
- [ ] Admin endpoints require authentication and authorization
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] Logging enabled for security events
- [ ] Monitoring and alerting configured
- [ ] Dependencies up to date (no known vulnerabilities)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information

### Regular Security Tasks

- [ ] Review and rotate secrets (monthly)
- [ ] Update dependencies (weekly)
- [ ] Review access logs (daily)
- [ ] Run security scans (quarterly)
- [ ] Review user permissions (monthly)
- [ ] Test incident response (quarterly)
- [ ] Update security documentation (as needed)

## Verification Checklist

After completing Phase 9:

- [ ] JWT tokens have expiration
- [ ] Refresh token flow implemented
- [ ] Passwords hashed with BCrypt
- [ ] Password requirements enforced
- [ ] CORS configured for production
- [ ] SQL injection prevention in place
- [ ] XSS protection configured
- [ ] Rate limiting enabled
- [ ] Admin-only endpoints protected
- [ ] Security headers configured
- [ ] HTTPS/TLS configured
- [ ] Security audit logging enabled
- [ ] Monitoring and alerting setup
- [ ] Security checklist completed
- [ ] Documentation updated

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Spring Security Reference](https://docs.spring.io/spring-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Summary

This security phase covers:

1. **JWT Token Management**: Expiration, rotation, revocation
2. **Password Hashing**: BCrypt implementation, requirements
3. **CORS Configuration**: Proper origin handling
4. **SQL Injection Prevention**: Parameterized queries, validation
5. **XSS Prevention**: React protections, CSP headers
6. **Rate Limiting**: Nginx and backend implementation
7. **Admin Protection**: Role-based access control
8. **Security Headers**: HSTS, X-Frame-Options, etc.
9. **HTTPS/TLS**: Certificate setup, SSL configuration
10. **Security Monitoring**: Logging, alerts, intrusion detection

Following these practices will significantly improve the security posture of the NewTab application.

## Final Checklist

After completing all phases:

- [ ] Monorepo infrastructure setup
- [ ] Backend services implemented
- [ ] Frontend microfrontends configured
- [ ] Nginx routing configured
- [ ] Docker orchestration setup
- [ ] Core features implemented
- [ ] NX workspace configured
- [ ] Tests written and passing
- [ ] Documentation complete
- [ ] Security best practices applied
- [ ] Ready for deployment

## Next Steps

Proceed to [Deployment Guide](../DEPLOYMENT.md)
