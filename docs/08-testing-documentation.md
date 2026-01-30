# Phase 8: Testing & Documentation

## Overview

This phase covers testing strategies for all layers of the application and comprehensive documentation.

## 8.1 Testing

### Backend Testing (JUnit5 + Mockito)

### Unit Tests

Test individual components in isolation.

**Example: SponsorService Test**

**File:** `/apps/be/newtab-service/src/test/java/com/newtab/service/service/SponsorServiceTest.java`

```java
package com.newtab.service.service;

import com.newtab.service.entity.Sponsor;
import com.newtab.service.repository.SponsorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SponsorServiceTest {

    @Mock
    private SponsorRepository sponsorRepository;

    @InjectMocks
    private SponsorService sponsorService;

    private Sponsor sponsor1;
    private Sponsor sponsor2;

    @BeforeEach
    void setUp() {
        sponsor1 = new Sponsor();
        sponsor1.setId(1L);
        sponsor1.setName("Sponsor 1");
        sponsor1.setType("image");
        sponsor1.setMediaUrl("https://example.com/img1.jpg");
        sponsor1.setIsActive(true);

        sponsor2 = new Sponsor();
        sponsor2.setId(2L);
        sponsor2.setName("Sponsor 2");
        sponsor2.setType("video");
        sponsor2.setMediaUrl("https://example.com/vid1.mp4");
        sponsor2.setIsActive(true);
    }

    @Test
    void testGetRandomSponsor_WithActiveSponsors_ReturnsSponsor() {
        // Given
        when(sponsorRepository.findByIsActive(true))
            .thenReturn(Arrays.asList(sponsor1, sponsor2));

        // When
        Sponsor result = sponsorService.getRandomSponsor();

        // Then
        assertNotNull(result);
        assertTrue(result.getId().equals(sponsor1.getId()) ||
                    result.getId().equals(sponsor2.getId()));
        verify(sponsorRepository, times(1)).findByIsActive(true);
    }

    @Test
    void testGetRandomSponsor_WithNoActiveSponsors_ReturnsNull() {
        // Given
        when(sponsorRepository.findByIsActive(true))
            .thenReturn(List.of());

        // When
        Sponsor result = sponsorService.getRandomSponsor();

        // Then
        assertNull(result);
        verify(sponsorRepository, times(1)).findByIsActive(true);
    }

    @Test
    void testCreateSponsor_SavesSponsor() {
        // Given
        Sponsor newSponsor = new Sponsor();
        newSponsor.setName("New Sponsor");
        newSponsor.setType("image");
        newSponsor.setMediaUrl("https://example.com/new.jpg");

        when(sponsorRepository.save(any(Sponsor.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Sponsor result = sponsorService.createSponsor(newSponsor);

        // Then
        assertNotNull(result);
        assertEquals("New Sponsor", result.getName());
        assertTrue(result.getIsActive());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getUpdatedAt());
        verify(sponsorRepository, times(1)).save(any(Sponsor.class));
    }

    @Test
    void testDeleteSponsor_WithValidId_DeletesSponsor() {
        // Given
        Long sponsorId = 1L;
        when(sponsorRepository.findById(sponsorId))
            .thenReturn(Optional.of(sponsor1));

        // When
        sponsorService.deleteSponsor(sponsorId);

        // Then
        verify(sponsorRepository, times(1)).findById(sponsorId);
        verify(sponsorRepository, times(1)).delete(sponsor1);
    }

    @Test
    void testDeleteSponsor_WithInvalidId_ThrowsException() {
        // Given
        Long sponsorId = 999L;
        when(sponsorRepository.findById(sponsorId))
            .thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            sponsorService.deleteSponsor(sponsorId);
        });

        verify(sponsorRepository, times(1)).findById(sponsorId);
        verify(sponsorRepository, never()).delete(any());
    }
}
```

### Integration Tests

Test multiple components working together.

**Example: Auth Controller Integration Test**

**File:** `/apps/be/auth-service/src/test/java/com/newtab/auth/integration/AuthControllerIntegrationTest.java`

```java
package com.newtab.auth.integration;

import com.newtab.auth.dto.AuthResponse;
import com.newtab.auth.dto.LoginRequest;
import com.newtab.auth.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        // Setup test database
    }

    @AfterEach
    void tearDown() {
        // Cleanup test database
    }

    @Test
    void testRegister_ValidUser_ReturnsToken() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.type").value("Bearer"));
    }

    @Test
    void testRegister_DuplicateEmail_ReturnsError() throws Exception {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        // First registration
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());

        // When & Then
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isInternalServerError());
    }

    @Test
    void testLogin_ValidCredentials_ReturnsToken() throws Exception {
        // Given
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("login@example.com");
        registerRequest.setPassword("password123");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("login@example.com");
        loginRequest.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void testLogin_InvalidCredentials_ReturnsError() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setEmail("invalid@example.com");
        request.setPassword("wrongpassword");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isInternalServerError());
    }

    @Test
    void testGuestToken_ReturnsValidToken() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/guest"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists());
    }
}
```

### Frontend Testing (Vitest + React Testing Library)

### Unit Tests

Test React components in isolation.

**Example: SponsorBackground Component Test**

**File:** `/apps/fe/newtab/src/components/SponsorBackground.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { SponsorBackground } from './SponsorBackground'
import * as apiModule from '../utils/api'

describe('SponsorBackground', () => {
  const mockSponsor = {
    id: 1,
    name: 'Test Sponsor',
    type: 'image' as const,
    mediaUrl: 'https://example.com/test.jpg',
    linkUrl: 'https://example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state initially', () => {
    vi.spyOn(apiModule, 'api').mockRejectedValue(new Error('API Error'))

    render(<SponsorBackground />)

    expect(screen.getByTestId('sponsor-loading')).toBeInTheDocument()
  })

  it('should display image sponsor', async () => {
    vi.spyOn(apiModule, 'api').mockResolvedValue({ sponsor: mockSponsor })

    render(<SponsorBackground />)

    await waitFor(() => {
      const img = screen.getByAltText('Test Sponsor')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', mockSponsor.mediaUrl)
    })
  })

  it('should display video sponsor', async () => {
    const videoSponsor = { ...mockSponsor, type: 'video' as const }
    vi.spyOn(apiModule, 'api').mockResolvedValue({ sponsor: videoSponsor })

    render(<SponsorBackground />)

    await waitFor(() => {
      const video = screen.getByRole('video')
      expect(video).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    vi.spyOn(apiModule, 'api').mockRejectedValue(new Error('API Error'))

    render(<SponsorBackground />)

    await waitFor(() => {
      expect(screen.queryByTestId('sponsor-loading')).not.toBeInTheDocument()
    })
  })
})
```

### Component Tests

Test components with user interactions.

**Example: AutocompleteInput Component Test**

**File:** `/apps/fe/autocomplete-input/src/components/AutocompleteInput.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { AutocompleteInput } from './AutocompleteInput'

describe('AutocompleteInput', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn()
    localStorage.clear()
  })

  it('should render input field', () => {
    render(<AutocompleteInput />)

    const input = screen.getByPlaceholderText('Search web...')
    expect(input).toBeInTheDocument()
  })

  it('should show dropdown when typing', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [
        { id: 1, query: 'test search 1', createdAt: '2024-01-01' },
        { id: 2, query: 'test search 2', createdAt: '2024-01-01' },
      ]}),
    })

    localStorage.setItem('authToken', 'test-token')

    render(<AutocompleteInput />)

    const input = screen.getByPlaceholderText('Search web...')
    fireEvent.change(input, { target: { value: 'test' } })

    await waitFor(() => {
      expect(screen.getByText('test search 1')).toBeInTheDocument()
      expect(screen.getByText('test search 2')).toBeInTheDocument()
    })
  })

  it('should call onSearch when submitting', () => {
    const mockOnSearch = vi.fn()
    render(<AutocompleteInput onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search web...')
    fireEvent.change(input, { target: { value: 'test query' } })

    const button = screen.getByText('Search')
    fireEvent.click(button)

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should submit on Enter key', () => {
    const mockOnSearch = vi.fn()
    render(<AutocompleteInput onSearch={mockOnSearch} />)

    const input = screen.getByPlaceholderText('Search web...')
    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('should save to history on search', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    localStorage.setItem('authToken', 'test-token')

    render(<AutocompleteInput />)

    const input = screen.getByPlaceholderText('Search web...')
    fireEvent.change(input, { target: { value: 'test query' } })

    const button = screen.getByText('Search')
    fireEvent.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/history'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test query'),
        })
      )
    })
  })
})
```

### Hook Tests

Test custom React hooks.

**Example: useSponsor Hook Test**

**File:** `/apps/fe/newtab/src/hooks/useSponsor.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { useSponsor } from './useSponsor'
import * as apiModule from '../utils/api'

describe('useSponsor', () => {
  const mockSponsor = {
    id: 1,
    name: 'Test Sponsor',
    type: 'image' as const,
    mediaUrl: 'https://example.com/test.jpg',
    linkUrl: 'https://example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load sponsor on mount', async () => {
    vi.spyOn(apiModule, 'api').mockResolvedValue({ sponsor: mockSponsor })

    const { result } = renderHook(() => useSponsor())

    expect(result.current.loading).toBe(true)
    expect(result.current.sponsor).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.sponsor).toEqual(mockSponsor)
    })
  })

  it('should handle API errors', async () => {
    vi.spyOn(apiModule, 'api').mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useSponsor())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to load sponsor')
      expect(result.current.sponsor).toBe(null)
    })
  })

  it('should provide reload function', async () => {
    const mockApi = vi.spyOn(apiModule, 'api').mockResolvedValue({ sponsor: mockSponsor })

    const { result } = renderHook(() => useSponsor())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Call reload
    await act(async () => {
      await result.current.reload()
    })

    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledTimes(2)
    })
  })
})
```

### E2E Testing (Playwright)

### Setup

**File:** `/tests/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:80',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'docker-compose up',
    url: 'http://localhost:80',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
```

### Test Examples

**File:** `/tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/')

    // Click login button
    await page.click('button:has-text("Login")')

    // Click register link
    await page.click('text=Register')

    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL('/')
    await expect(page.locator('button:has-text("Settings")')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/')

    // Click login button
    await page.click('button:has-text("Login")')

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL('/')
    await expect(page.locator('button:has-text("Settings")')).toBeVisible()
  })

  test('should allow guest access', async ({ page }) => {
    await page.goto('/')

    // Verify page loads without authentication
    await expect(page.locator('h1:has-text("NewTab")')).toBeVisible()
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })
})
```

**File:** `/tests/e2e/search.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('should save search to history', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test query')

    // Submit search
    await page.click('button:has-text("Search")')

    // Navigate to settings to verify history
    await page.click('button:has-text("Settings")')
    await page.click('text=History')

    // Verify search is in history
    await expect(page.locator('text=test query')).toBeVisible()
  })

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')

    // Type partial query
    await searchInput.fill('test')

    // Wait for dropdown
    await page.waitForSelector('.autocomplete-dropdown')

    // Verify suggestions appear
    const suggestions = page.locator('.autocomplete-suggestion')
    await expect(suggestions).toHaveCount(1)
  })
})
```

**File:** `/tests/e2e/sponsors.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Sponsor Display', () => {
  test('should display random sponsor', async ({ page }) => {
    await page.goto('/')

    // Wait for sponsor to load
    await page.waitForSelector('.sponsor-background__media')

    // Verify sponsor is displayed
    const sponsorMedia = page.locator('.sponsor-background__media')
    await expect(sponsorMedia).toBeVisible()

    // Reload and verify different sponsor might appear
    await page.reload()
    await page.waitForSelector('.sponsor-background__media')
  })

  test('should hide sponsors when disabled', async ({ page }) => {
    // Login
    await page.goto('/')
    await page.click('button:has-text("Login")')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Open settings
    await page.click('button:has-text("Settings")')

    // Disable sponsors
    await page.uncheck('input:has-text("Show Sponsors")')
    await page.click('button:has-text("Save")')

    // Navigate back
    await page.goto('/')

    // Verify sponsor is not visible
    await expect(page.locator('.sponsor-background')).not.toBeVisible()
  })
})
```

## 8.2 Documentation

### Main README

**File:** `/README.md`

```markdown
# NewTab Browser Application

A microfrontend-based NewTab browser application with sponsor management, news feed, and search history.

## Features

- **Microfrontend Architecture**: Modular React applications with module federation
- **Authentication**: Guest access and email/password authentication with JWT
- **Search**: Autocomplete with search history
- **Sponsor Management**: Random rotation of sponsor backgrounds
- **News Feed**: Scrolling grid of cached news articles
- **Settings**: Theme switching (light/dark/auto) and visibility toggles
- **Admin Panel**: Sponsor management interface

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Nginx (Reverse Proxy)            │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐
│ Auth    │ │ NewTab  │ │ Frontend     │
│ Service │ │ Service │ │ Apps         │
│(8081)  │ │(8082)  │ │(5173,5001)  │
└─────────┘ └────┬────┘ └──────────────┘
                 │
            ┌────┴────┐
            │PostgreSQL│
            │ (5432)   │
            └───────────┘
```

## Tech Stack

### Backend
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Flyway (migrations)
- JUnit5 + Mockito (testing)

### Frontend
- React 19
- Vite 7
- TypeScript 5
- Module Federation (@originjs/vite-plugin-federation)
- Vitest + React Testing Library (testing)
- Playwright (E2E testing)

### Infrastructure
- NX (monorepo management)
- Docker & Docker Compose
- Nginx (reverse proxy)
- PNPM (package manager)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- Java 21+ (for local backend dev)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd microservice

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d
```

### Access

- **Application**: http://localhost
- **Admin Panel**: http://localhost/admin
- **API**: http://localhost/api
- **Auth API**: http://localhost/api/auth

### Development

```bash
# Start development servers
pnpm run dev

# Build all apps
pnpm run build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Documentation

- [Setup Guide](./docs/01-monorepo-infrastructure.md)
- [Backend Implementation](./docs/02-backend-implementation.md)
- [Frontend Microfrontends](./docs/03-frontend-microfrontends.md)
- [Nginx Configuration](./docs/04-nginx-configuration.md)
- [Docker Orchestration](./docs/05-docker-orchestration.md)
- [Implementation Details](./docs/06-implementation-details.md)
- [NX Workspace](./docs/07-nx-workspace.md)
- [Testing](./docs/08-testing-documentation.md)
- [Security](./docs/09-security.md)
- [Deployment](./DEPLOYMENT.md)

## API Documentation

See [API.md](./API.md) for complete API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Commit with conventional commits
6. Push and create a pull request

## License

MIT License - see LICENSE file for details.
```

### API Documentation

**File:** `/API.md`

```markdown
# NewTab API Documentation

## Authentication

All endpoints require authentication except `/api/auth/*`.

### Get Guest Token

```http
POST /api/auth/guest
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "refreshToken": "jwt-refresh-token",
  "type": "Bearer"
}
```

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "refreshToken": "jwt-refresh-token",
  "type": "Bearer"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "refreshToken": "jwt-refresh-token",
  "type": "Bearer"
}
```

### Validate Token

```http
GET /api/auth/validate
Authorization: Bearer <token>
```

**Response:**
```text
user@example.com
```

## Search History

### Get Search History

```http
GET /api/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "userId": 123,
      "query": "test search",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Add to History

```http
POST /api/history
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "new search"
}
```

**Response:**
```json
{
  "id": 2,
  "userId": 123,
  "query": "new search",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### Delete Search Entry

```http
DELETE /api/history/{id}
Authorization: Bearer <token>
```

### Clear History

```http
DELETE /api/history
Authorization: Bearer <token>
```

## Sponsors

### Get Random Sponsor

```http
GET /api/sponsors/random
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sponsor": {
    "id": 1,
    "name": "Example Sponsor",
    "type": "image",
    "mediaUrl": "https://example.com/sponsor.jpg",
    "linkUrl": "https://example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create Sponsor (Admin)

```http
POST /api/admin/sponsors
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Sponsor",
  "type": "image",
  "mediaUrl": "https://example.com/new.jpg",
  "linkUrl": "https://example.com"
}
```

### Update Sponsor (Admin)

```http
PUT /api/admin/sponsors/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

### Delete Sponsor (Admin)

```http
DELETE /api/admin/sponsors/{id}
Authorization: Bearer <token>
```

## News

### Get News

```http
GET /api/news
Authorization: Bearer <token>
```

**Response:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "Article Title",
      "description": "Article description",
      "url": "https://example.com/article",
      "source": "CNN",
      "publishedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## User Preferences

### Get Preferences

```http
GET /api/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "theme": "dark",
  "backgroundType": "video",
  "showNews": true,
  "showSponsors": true,
  "showHistory": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Update Preferences

```http
PUT /api/preferences
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "theme": "light",
  "backgroundType": "image",
  "showNews": false,
  "showSponsors": true,
  "showHistory": true
}
```
```

### Development Guide

**File:** `/DEVELOPMENT.md`

```markdown
# Development Guide

## Local Development Setup

### Prerequisites

1. **Node.js 18+**
```bash
node --version  # Should be >= 18.0.0
```

2. **pnpm 8+**
```bash
npm install -g pnpm
pnpm --version  # Should be >= 8.0.0
```

3. **Java 21+** (for backend development)
```bash
java --version  # Should be >= 21
```

4. **Docker & Docker Compose**
```bash
docker --version
docker-compose --version
```

5. **PostgreSQL** (optional, can use Docker)
```bash
psql --version
```

### Setup Steps

1. **Clone Repository**
```bash
git clone <repository-url>
cd microservice
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Services**

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Manual (Development)**
```bash
# Start database
docker-compose up -d postgres

# Start backend services
cd apps/be/auth-service
mvn spring-boot:run

# In another terminal
cd apps/be/newtab-service
mvn spring-boot:run

# Start frontend services
pnpm run dev
```

5. **Access Application**
- Frontend: http://localhost:5173
- Admin: http://localhost:5174
- Auth API: http://localhost:8081
- NewTab API: http://localhost:8082

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
nx run newtab-shell:test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with coverage
pnpm test -- --coverage
```

### Building

```bash
# Build all apps
pnpm run build

# Build specific app
nx run newtab-shell:build

# Build for production
nx run newtab-shell:build:production
```

### Linting

```bash
# Lint all files
pnpm lint

# Lint specific app
nx run newtab-shell:lint

# Auto-fix linting errors
nx run newtab-shell:lint --fix
```

### Adding New Features

1. **Backend (Spring Boot)**
```bash
cd apps/be/newtab-service

# Add entity, repository, service, controller
# Run tests
mvn test

# Build
mvn clean package
```

2. **Frontend (React)**
```bash
cd apps/fe/newtab

# Add component, hook, API client
# Run tests
pnpm test

# Build
pnpm build
```

3. **Update Database**
```bash
cd apps/be/newtab-service

# Create migration file
# src/main/resources/db/migration/V{timestamp}__description.sql

# Restart service (Flyway will run migration)
```

### Debugging

**Backend:**
```bash
# Run with debug port
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# Connect IDE to localhost:5005
```

**Frontend:**
```bash
# Run with inspection
pnpm run dev:shell --inspect

# Connect IDE to localhost:9229
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :5173

# Kill process
kill -9 <PID>

# Or change port in vite.config.ts
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs newtab-postgres

# Test connection
psql -h localhost -U newtab -d newtab
```

### Module Federation Issues

```bash
# Clear Vite cache
rm -rf apps/fe/*/node_modules/.vite

# Clear NX cache
nx reset

# Restart dev servers
pnpm run dev
```

## Contributing

### Code Style

- **Backend**: Follow Spring Boot conventions
- **Frontend**: Follow React and TypeScript best practices
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

### Pull Request Process

1. Create feature branch
2. Make changes
3. Run tests: `pnpm test`
4. Run linter: `pnpm lint`
5. Update documentation
6. Create pull request

### Code Review Checklist

- [ ] Tests pass
- [ ] Linter passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Security review completed
```

## Verification Checklist

After completing Phase 8:

- [ ] Backend unit tests cover critical paths
- [ ] Backend integration tests test API endpoints
- [ ] Frontend unit tests cover components
- [ ] Frontend component tests test user interactions
- [ ] Hook tests verify behavior
- [ ] E2E tests cover critical user flows
- [ ] All tests pass in CI
- [ ] README.md created
- [ ] API.md created
- [ ] DEVELOPMENT.md created
- [ ] Deployment documentation exists
- [ ] Code is well-documented
- [ ] Test coverage is adequate (>80%)

## Next Steps

Proceed to [Phase 9: Security Considerations](./09-security.md)
