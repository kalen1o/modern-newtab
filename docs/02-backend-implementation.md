# Phase 2: Backend Implementation

## Overview

This phase covers implementing two Spring Boot services: authentication service and main newtab service, including database integration with Flyway migrations.

## 2.1 Authentication Service (apps/be/auth-service)

### Technology Stack
- Spring Boot 3.2.x
- Spring Security 6.x
- Spring Data JPA
- JWT (io.jsonwebtoken:jjwt)
- PostgreSQL
- Maven

### Project Structure

```
apps/be/auth-service/
├── src/
│   ├── main/
│   │   ├── java/com/newtab/auth/
│   │   │   ├── AuthApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── JwtConfig.java
│   │   │   ├── security/
│   │   │   │   ├── JwtProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   └── UserService.java
│   │   │   ├── repository/
│   │   │   │   └── UserRepository.java
│   │   │   ├── dto/
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── AuthResponse.java
│   │   │   │   └── RefreshTokenRequest.java
│   │   │   └── exception/
│   │   │       └── AuthException.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   └── test/
│       └── java/com/newtab/auth/
└── pom.xml
```

### Step 1: Create pom.xml

**File:** `/apps/be/auth-service/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.newtab</groupId>
    <artifactId>auth-service</artifactId>
    <version>1.0.0</version>
    <name>auth-service</name>
    <description>Authentication service for NewTab application</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.3</jjwt.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- BCrypt for password hashing -->
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-crypto</artifactId>
        </dependency>

        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### Step 2: Create Application Configuration

**File:** `/apps/be/auth-service/src/main/resources/application.yml`

```yaml
server:
  port: 8081

spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://localhost:5432/newtab
    username: newtab
    password: newtab
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

jwt:
  secret: ${JWT_SECRET:your-super-secret-key-change-this-in-production-min-256-bits}
  expiration: 86400000  # 24 hours in milliseconds
  refresh-expiration: 604800000  # 7 days in milliseconds

logging:
  level:
    com.newtab.auth: DEBUG
    org.springframework.security: DEBUG
```

### Step 3: Create Entity

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/entity/User.java`

```java
package com.newtab.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
```

### Step 4: Create Repository

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/repository/UserRepository.java`

```java
package com.newtab.auth.repository;

import com.newtab.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### Step 5: Create DTOs

**RegisterRequest:**

```java
package com.newtab.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

**LoginRequest:**

```java
package com.newtab.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

**AuthResponse:**

```java
package com.newtab.auth.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";

    public AuthResponse(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
    }

    // Getters
    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
    public String getType() { return type; }
}
```

### Step 6: Create JWT Provider

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/security/JwtProvider.java`

```java
package com.newtab.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
```

### Step 7: Create Service

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/service/AuthService.java`

```java
package com.newtab.auth.service;

import com.newtab.auth.dto.AuthResponse;
import com.newtab.auth.dto.LoginRequest;
import com.newtab.auth.dto.RegisterRequest;
import com.newtab.auth.entity.User;
import com.newtab.auth.repository.UserRepository;
import com.newtab.auth.security.JwtProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtProvider jwtProvider) {
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getEmail());
        return new AuthResponse(token, token); // Same token for refresh for simplicity
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtProvider.generateToken(user.getEmail());
        return new AuthResponse(token, token);
    }

    public AuthResponse guestToken() {
        // Generate token for guest user (no user creation)
        String guestEmail = "guest-" + System.currentTimeMillis() + "@guest.newtab";
        String token = jwtProvider.generateToken(guestEmail);
        return new AuthResponse(token, token);
    }

    public String validateToken(String token) {
        if (!jwtProvider.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }
        return jwtProvider.getEmailFromToken(token);
    }
}
```

### Step 8: Create Controller

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/controller/AuthController.java`

```java
package com.newtab.auth.controller;

import com.newtab.auth.dto.AuthResponse;
import com.newtab.auth.dto.LoginRequest;
import com.newtab.auth.dto.RegisterRequest;
import com.newtab.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> guest() {
        AuthResponse response = authService.guestToken();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = authService.validateToken(token);
        AuthResponse response = authService.login(email); // Re-generate token
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validate(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = authService.validateToken(token);
        return ResponseEntity.ok(email);
    }
}
```

### Step 9: Create Security Configuration

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/config/SecurityConfig.java`

```java
package com.newtab.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

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
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### Step 10: Create Main Application

**File:** `/apps/be/auth-service/src/main/java/com/newtab/auth/AuthApplication.java`

```java
package com.newtab.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }
}
```

### Step 11: Create Flyway Migration

**File:** `/apps/be/auth-service/src/main/resources/db/migration/V1__Create_users_table.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## 2.2 Main NewTab Service

### Technology Stack
- Spring Boot 3.2.x
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven

### Key Components

The newtab-service handles:
- Search history management
- Sponsor CRUD and rotation
- News article caching
- User preferences
- Settings management

### Implementation Steps

Similar structure to auth-service but with additional entities and controllers for:
- SearchHistory entity and repository
- Sponsor entity and repository
- NewsArticle entity and repository
- UserPreferences entity and repository
- Controllers for each domain
- Sponsor rotation service with random selection
- Background job for news fetching

### Database Migration

**File:** `/apps/be/newtab-service/src/main/resources/db/migration/V1__Create_main_tables.sql`

```sql
-- Search History
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video')),
    media_url VARCHAR(1000) NOT NULL,
    link_url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(is_active);

-- Sponsor Settings
CREATE TABLE IF NOT EXISTS sponsor_settings (
    id SERIAL PRIMARY KEY,
    rotation_strategy VARCHAR(50) NOT NULL DEFAULT 'random',
    display_duration INTEGER DEFAULT 30000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sponsor_settings (rotation_strategy, display_duration)
VALUES ('random', 30000)
ON CONFLICT DO NOTHING;

-- News Articles
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(100),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
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

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
```

## 2.3 Database Configuration

### Connection Pooling

Both services use the same PostgreSQL database with connection pooling configured in `application.yml`.

### Flyway Integration

Flyway automatically runs migrations on startup. Versioned migration files in `src/main/resources/db/migration/` ensure schema consistency.

## Verification Checklist

After completing Phase 2:

- [ ] Auth service pom.xml created with all dependencies
- [ ] Auth service entities, repositories, DTOs created
- [ ] JWT provider implemented with token generation/validation
- [ ] Auth service endpoints: register, login, guest, refresh, validate
- [ ] Auth service security configuration allows /api/auth/**
- [ ] Newtab service pom.xml created
- [ ] Newtab service entities: SearchHistory, Sponsor, NewsArticle, UserPreferences
- [ ] Newtab service repositories for all entities
- [ ] Sponsor rotation service with random selection
- [ ] Controllers for history, sponsors, news, preferences
- [ ] Flyway migrations created for both services
- [ ] Services can connect to PostgreSQL
- [ ] Migrations run successfully on startup

## Testing

### Manual Testing

```bash
# Test auth service
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -X POST http://localhost:8081/api/auth/guest

curl -X GET http://localhost:8081/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

Proceed to [Phase 3: Frontend Microfrontends Setup](./03-frontend-microfrontends.md)
