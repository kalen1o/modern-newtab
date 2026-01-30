# Phase 6: Implementation Details

## Overview

This phase covers specific implementation details for key features: sponsor rotation, search history flow, news feed integration, and settings management.

## 6.1 Sponsor Rotation Logic (Simple Random)

### Backend Implementation

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/service/SponsorService.java`

```java
package com.newtab.service.service;

import com.newtab.service.entity.Sponsor;
import com.newtab.service.repository.SponsorRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final Random random;

    public SponsorService(SponsorRepository sponsorRepository) {
        this.sponsorRepository = sponsorRepository;
        this.random = new Random();
    }

    /**
     * Get a random active sponsor
     * @return Random sponsor or null if no active sponsors exist
     */
    public Sponsor getRandomSponsor() {
        List<Sponsor> activeSponsors = sponsorRepository.findByIsActive(true);

        if (activeSponsors.isEmpty()) {
            return null;
        }

        int randomIndex = random.nextInt(activeSponsors.size());
        return activeSponsors.get(randomIndex);
    }

    /**
     * Get all sponsors (for admin)
     */
    public List<Sponsor> getAllSponsors() {
        return sponsorRepository.findAll();
    }

    /**
     * Get only active sponsors (for rotation)
     */
    public List<Sponsor> getActiveSponsors() {
        return sponsorRepository.findByIsActive(true);
    }

    /**
     * Create new sponsor
     */
    public Sponsor createSponsor(Sponsor sponsor) {
        sponsor.setCreatedAt(LocalDateTime.now());
        sponsor.setUpdatedAt(LocalDateTime.now());
        sponsor.setIsActive(true);
        return sponsorRepository.save(sponsor);
    }

    /**
     * Update existing sponsor
     */
    public Sponsor updateSponsor(Long id, Sponsor sponsorDetails) {
        Sponsor sponsor = sponsorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sponsor not found"));

        sponsor.setName(sponsorDetails.getName());
        sponsor.setType(sponsorDetails.getType());
        sponsor.setMediaUrl(sponsorDetails.getMediaUrl());
        sponsor.setLinkUrl(sponsorDetails.getLinkUrl());
        sponsor.setIsActive(sponsorDetails.getIsActive());
        sponsor.setUpdatedAt(LocalDateTime.now());

        return sponsorRepository.save(sponsor);
    }

    /**
     * Delete sponsor
     */
    public void deleteSponsor(Long id) {
        Sponsor sponsor = sponsorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sponsor not found"));
        sponsorRepository.delete(sponsor);
    }
}
```

### Controller Endpoint

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/controller/SponsorController.java`

```java
package com.newtab.service.controller;

import com.newtab.service.entity.Sponsor;
import com.newtab.service.service.SponsorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sponsors")
public class SponsorController {

    private final SponsorService sponsorService;

    public SponsorController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }

    /**
     * Get random active sponsor (for frontend display)
     */
    @GetMapping("/random")
    public ResponseEntity<Map<String, Sponsor>> getRandomSponsor() {
        Sponsor sponsor = sponsorService.getRandomSponsor();
        if (sponsor == null) {
            return ResponseEntity.ok(Map.of("sponsor", new Sponsor())); // Empty sponsor
        }
        return ResponseEntity.ok(Map.of("sponsor", sponsor));
    }

    /**
     * Get all active sponsors
     */
    @GetMapping("/active")
    public ResponseEntity<List<Sponsor>> getActiveSponsors() {
        return ResponseEntity.ok(sponsorService.getActiveSponsors());
    }
}

/**
 * Admin endpoints
 */
@RestController
@RequestMapping("/api/admin/sponsors")
public class SponsorAdminController {

    private final SponsorService sponsorService;

    public SponsorAdminController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }

    @GetMapping
    public ResponseEntity<List<Sponsor>> getAllSponsors() {
        return ResponseEntity.ok(sponsorService.getAllSponsors());
    }

    @PostMapping
    public ResponseEntity<Sponsor> createSponsor(@RequestBody Sponsor sponsor) {
        Sponsor created = sponsorService.createSponsor(sponsor);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sponsor> updateSponsor(
        @PathVariable Long id,
        @RequestBody Sponsor sponsor
    ) {
        Sponsor updated = sponsorService.updateSponsor(id, sponsor);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSponsor(@PathVariable Long id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Frontend Integration

**File:** `/apps/fe/newtab/src/hooks/useSponsor.ts`

```typescript
import { useState, useEffect } from 'react'
import { Sponsor } from '../types'
import { api } from '../utils/api'

export function useSponsor() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSponsor = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<{ sponsor: Sponsor }>(
        `${process.env.VITE_API_BASE_URL}/api/sponsors/random`
      )
      setSponsor(response.sponsor)
    } catch (err) {
      setError('Failed to load sponsor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSponsor()
  }, [])

  return { sponsor, loading, error, reload: loadSponsor }
}
```

### Rotation Strategy Options

#### Simple Random (Current)

```java
public Sponsor getRandomSponsor() {
    List<Sponsor> activeSponsors = sponsorRepository.findByIsActive(true);
    if (activeSponsors.isEmpty()) return null;
    Random random = new Random();
    return activeSponsors.get(random.nextInt(activeSponsors.size()));
}
```

#### Time-Based Rotation (Future Enhancement)

```java
public Sponsor getSponsorForTime(LocalDateTime time) {
    List<Sponsor> activeSponsors = sponsorRepository.findByIsActive(true);
    if (activeSponsors.isEmpty()) return null;

    // Calculate index based on time
    long minutesSinceEpoch = time.atZone(ZoneId.UTC).toEpochSecond() / 60;
    int index = (int) (minutesSinceEpoch % activeSponsors.size());
    return activeSponsors.get(index);
}
```

#### Weighted Random (Future Enhancement)

```java
public Sponsor getWeightedRandomSponsor() {
    List<Sponsor> activeSponsors = sponsorRepository.findByIsActive(true);
    if (activeSponsors.isEmpty()) return null;

    // Sum all weights
    int totalWeight = activeSponsors.stream()
        .mapToInt(Sponsor::getWeight)
        .sum();

    // Pick random number
    int randomWeight = new Random().nextInt(totalWeight);

    // Find sponsor at random weight position
    int cumulativeWeight = 0;
    for (Sponsor sponsor : activeSponsors) {
        cumulativeWeight += sponsor.getWeight();
        if (randomWeight < cumulativeWeight) {
            return sponsor;
        }
    }

    return activeSponsors.get(activeSponsors.size() - 1);
}
```

## 6.2 Search History Flow

### Data Flow

```
User Input
    │
    ├── Autocomplete suggestions from history
    │
    ├── User selects suggestion OR types new query
    │
    ├── User submits search
    │
    ├── Save to database (POST /api/history)
    │
    ├── Redirect to search provider (Google, etc.)
    │
    └── Update history list in UI
```

### Backend Implementation

**Entity:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/entity/SearchHistory.java`

```java
package com.newtab.service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_history")
public class SearchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 500)
    private String query;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
```

**Repository:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/repository/SearchHistoryRepository.java`

```java
package com.newtab.service.repository;

import com.newtab.service.entity.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<SearchHistory> findByUserIdAndQuery(Long userId, String query);

    // For guest users (userId is null)
    List<SearchHistory> findByQueryContainingIgnoreCaseOrderByCreatedAtDesc(String query);

    void deleteByUserId(Long userId);
}
```

**Service:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/service/SearchHistoryService.java`

```java
package com.newtab.service.service;

import com.newtab.service.entity.SearchHistory;
import com.newtab.service.repository.SearchHistoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SearchHistoryService {

    private final SearchHistoryRepository repository;

    public SearchHistoryService(SearchHistoryRepository repository) {
        this.repository = repository;
    }

    /**
     * Add search to history
     */
    public SearchHistory addSearch(Long userId, String query) {
        SearchHistory history = new SearchHistory();
        history.setUserId(userId);
        history.setQuery(query);
        return repository.save(history);
    }

    /**
     * Get user's search history (most recent first)
     */
    public List<SearchHistory> getUserHistory(Long userId) {
        if (userId == null) {
            return List.of(); // No history for guest users
        }
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get recent searches (limit to N items)
     */
    public List<SearchHistory> getRecentSearches(Long userId, int limit) {
        List<SearchHistory> all = getUserHistory(userId);
        return all.stream().limit(limit).toList();
    }

    /**
     * Delete single search entry
     */
    public void deleteSearch(Long id) {
        repository.deleteById(id);
    }

    /**
     * Clear all history for user
     */
    public void clearHistory(Long userId) {
        if (userId != null) {
            repository.deleteByUserId(userId);
        }
    }

    /**
     * Search within history (for autocomplete)
     */
    public List<String> searchHistory(Long userId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getUserHistory(userId)
                .stream()
                .map(SearchHistory::getQuery)
                .limit(10)
                .toList();
        }

        return getUserHistory(userId)
            .stream()
            .map(SearchHistory::getQuery)
            .filter(q -> q.toLowerCase().contains(query.toLowerCase()))
            .limit(5)
            .toList();
    }
}
```

**Controller:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/controller/SearchHistoryController.java`

```java
package com.newtab.service.controller;

import com.newtab.service.entity.SearchHistory;
import com.newtab.service.service.SearchHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    public SearchHistoryController(SearchHistoryService searchHistoryService) {
        this.searchHistoryService = searchHistoryService;
    }

    /**
     * Get user's search history
     */
    @GetMapping
    public ResponseEntity<Map<String, List<SearchHistory>>> getHistory(
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        List<SearchHistory> history = searchHistoryService.getUserHistory(userId);
        return ResponseEntity.ok(Map.of("items", history));
    }

    /**
     * Add search to history
     */
    @PostMapping
    public ResponseEntity<SearchHistory> addHistory(
        @RequestBody Map<String, String> request,
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        String query = request.get("query");
        SearchHistory saved = searchHistoryService.addSearch(userId, query);
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete single search entry
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(
        @PathVariable Long id,
        @RequestHeader("X-User-Email") String userEmail
    ) {
        searchHistoryService.deleteSearch(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Clear all history
     */
    @DeleteMapping
    public ResponseEntity<Void> clearHistory(
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        searchHistoryService.clearHistory(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Autocomplete suggestions from history
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, List<String>>> searchHistory(
        @RequestParam String query,
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        List<String> suggestions = searchHistoryService.searchHistory(userId, query);
        return ResponseEntity.ok(Map.of("suggestions", suggestions));
    }

    /**
     * Extract user ID from email
     * Returns null for guest users (email contains "@guest.newtab")
     */
    private Long extractUserId(String email) {
        if (email == null || email.contains("@guest.newtab")) {
            return null;
        }
        // Query user service to get ID from email
        // For simplicity, assume email format is "id@domain"
        try {
            return Long.parseLong(email.split("@")[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
```

### Frontend Implementation

**Hook:**

**File:** `/apps/fe/autocomplete-input/src/hooks/useSearchHistory.ts`

```typescript
import { useState, useEffect } from 'react'

export interface SearchHistoryItem {
  id: number
  query: string
  createdAt: string
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setHistory([])
        return
      }

      const response = await fetch(
        `${process.env.VITE_API_BASE_URL}/api/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setHistory(data.items)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToHistory = async (query: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(
        `${process.env.VITE_API_BASE_URL}/api/history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ query }),
        }
      )

      if (response.ok) {
        loadHistory() // Reload to get updated history
      }
    } catch (error) {
      console.error('Failed to save to history:', error)
    }
  }

  const searchHistory = async (query: string): Promise<string[]> => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return []

      const response = await fetch(
        `${process.env.VITE_API_BASE_URL}/api/history/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.suggestions
      }
    } catch (error) {
      console.error('Failed to search history:', error)
    }
    return []
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return { history, loading, addToHistory, searchHistory, reload: loadHistory }
}
```

## 6.3 News Feed Integration

### Overview

News articles are fetched from RSS/API, cached in PostgreSQL, and displayed in scroll grid.

### Backend Implementation

**Entity:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/entity/NewsArticle.java`

```java
package com.newtab.service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "news_articles")
public class NewsArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(length = 100)
    private String source;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSource() { return source; }
    public void setSource(String source) { source; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
```

**Service for News Fetching:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/service/NewsService.java`

```java
package com.newtab.service.service;

import com.newtab.service.entity.NewsArticle;
import com.newtab.service.repository.NewsArticleRepository;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class NewsService {

    private final NewsArticleRepository repository;
    private final SyndFeedInput feedInput;

    public NewsService(NewsArticleRepository repository) {
        this.repository = repository;
        this.feedInput = new SyndFeedInput();
    }

    /**
     * Get cached news articles
     */
    public List<NewsArticle> getCachedNews() {
        return repository.findByOrderByPublishedAtDesc();
    }

    /**
     * Fetch and cache news from RSS feeds
     * Runs every 30 minutes
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void fetchAndCacheNews() {
        List<String> rssUrls = List.of(
            "https://rss.cnn.com/rss/edition.rss",
            "https://feeds.bbci.co.uk/news/rss.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
        );

        for (String rssUrl : rssUrls) {
            try {
                fetchFromRss(rssUrl);
            } catch (Exception e) {
                System.err.println("Failed to fetch from " + rssUrl + ": " + e.getMessage());
            }
        }
    }

    /**
     * Fetch articles from a single RSS feed
     */
    private void fetchFromRss(String rssUrl) throws Exception {
        SyndFeed feed = feedInput.build(new URL(rssUrl));
        String source = feed.getTitle();

        for (SyndEntry entry : feed.getEntries()) {
            try {
                NewsArticle article = new NewsArticle();
                article.setTitle(entry.getTitle());
                article.setDescription(entry.getDescription() != null ?
                    entry.getDescription().getValue() : "");
                article.setUrl(entry.getLink());
                article.setSource(source);

                if (entry.getPublishedDate() != null) {
                    article.setPublishedAt(
                        LocalDateTime.ofInstant(
                            entry.getPublishedDate().toInstant(),
                            ZoneId.systemDefault()
                        )
                    );
                }

                // Check if article already exists (by URL)
                if (!repository.existsByUrl(article.getUrl())) {
                    repository.save(article);
                }
            } catch (Exception e) {
                System.err.println("Failed to process article: " + e.getMessage());
            }
        }
    }

    /**
     * Refresh news cache manually (for admin)
     */
    public void refreshCache() {
        // Clear old articles (older than 24 hours)
        LocalDateTime cutoff = LocalDateTime.now().minusDays(1);
        repository.deleteOlderThan(cutoff);

        // Fetch new articles
        fetchAndCacheNews();
    }

    /**
     * Get articles by source
     */
    public List<NewsArticle> getBySource(String source) {
        return repository.findBySourceOrderByPublishedAtDesc(source);
    }
}
```

**Controller:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/controller/NewsController.java`

```java
package com.newtab.service.controller;

import com.newtab.service.entity.NewsArticle;
import com.newtab.service.service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.scheduling.annotation.EnableAsync;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/news")
@EnableAsync
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    /**
     * Get all cached news articles
     */
    @GetMapping
    public ResponseEntity<Map<String, List<NewsArticle>>> getNews() {
        List<NewsArticle> articles = newsService.getCachedNews();
        return ResponseEntity.ok(Map.of("articles", articles));
    }

    /**
     * Get news by source
     */
    @GetMapping("/source/{source}")
    public ResponseEntity<Map<String, List<NewsArticle>>> getNewsBySource(
        @PathVariable String source
    ) {
        List<NewsArticle> articles = newsService.getBySource(source);
        return ResponseEntity.ok(Map.of("articles", articles));
    }

    /**
     * Refresh news cache (admin only)
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshCache() {
        newsService.refreshCache();
        return ResponseEntity.ok(Map.of("message", "News cache refreshed"));
    }
}
```

### Frontend Integration

**Hook:**

**File:** `/apps/fe/newtab/src/hooks/useNews.ts`

```typescript
import { useState, useEffect } from 'react'
import { NewsArticle } from '../types'
import { api } from '../utils/api'

export function useNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNews = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<{ articles: NewsArticle[] }>(
        `${process.env.VITE_API_BASE_URL}/api/news`
      )
      setArticles(response.articles)
    } catch (err) {
      setError('Failed to load news')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const refreshNews = async () => {
    try {
      await api.post(`${process.env.VITE_API_BASE_URL}/api/news/refresh`, {})
      await loadNews()
    } catch (err) {
      console.error('Failed to refresh news:', err)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  return { articles, loading, error, reload: loadNews, refresh: refreshNews }
}
```

## 6.4 Settings & Theme Management

### Backend Implementation

**Entity:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/entity/UserPreferences.java`

```java
package com.newtab.service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Column(length = 50)
    private String theme = "light";

    @Column(name = "background_type", length = 50)
    private String backgroundType = "image";

    @Column
    private Boolean showNews = true;

    @Column(name = "show_sponsors")
    private Boolean showSponsors = true;

    @Column(name = "show_history")
    private Boolean showHistory = true;

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

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getBackgroundType() { return backgroundType; }
    public void setBackgroundType(String backgroundType) { this.backgroundType = backgroundType; }

    public Boolean getShowNews() { return showNews; }
    public void setShowNews(Boolean showNews) { this.showNews = showNews; }

    public Boolean getShowSponsors() { return showSponsors; }
    public void setShowSponsors(Boolean showSponsors) { this.showSponsors = showSponsors; }

    public Boolean getShowHistory() { return showHistory; }
    public void setShowHistory(Boolean showHistory) { this.showHistory = showHistory; }
}
```

**Service:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/service/UserPreferencesService.java`

```java
package com.newtab.service.service;

import com.newtab.service.entity.UserPreferences;
import com.newtab.service.repository.UserPreferencesRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserPreferencesService {

    private final UserPreferencesRepository repository;

    public UserPreferencesService(UserPreferencesRepository repository) {
        this.repository = repository;
    }

    /**
     * Get user preferences
     */
    public UserPreferences getPreferences(Long userId) {
        return repository.findByUserId(userId)
            .orElseGet(this::createDefaultPreferences);
    }

    /**
     * Update user preferences
     */
    public UserPreferences updatePreferences(Long userId, UserPreferences preferences) {
        UserPreferences existing = getPreferences(userId);

        existing.setTheme(preferences.getTheme());
        existing.setBackgroundType(preferences.getBackgroundType());
        existing.setShowNews(preferences.getShowNews());
        existing.setShowSponsors(preferences.getShowSponsors());
        existing.setShowHistory(preferences.getShowHistory());

        return repository.save(existing);
    }

    /**
     * Create default preferences
     */
    private UserPreferences createDefaultPreferences() {
        UserPreferences prefs = new UserPreferences();
        prefs.setTheme("light");
        prefs.setBackgroundType("image");
        prefs.setShowNews(true);
        prefs.setShowSponsors(true);
        prefs.setShowHistory(true);
        return repository.save(prefs);
    }
}
```

**Controller:**

**File:** `/apps/be/newtab-service/src/main/java/com/newtab/service/controller/PreferencesController.java`

```java
package com.newtab.service.controller;

import com.newtab.service.entity.UserPreferences;
import com.newtab.service.service.UserPreferencesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/preferences")
public class PreferencesController {

    private final UserPreferencesService preferencesService;

    public PreferencesController(UserPreferencesService preferencesService) {
        this.preferencesService = preferencesService;
    }

    /**
     * Get user preferences
     */
    @GetMapping
    public ResponseEntity<UserPreferences> getPreferences(
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        UserPreferences preferences = preferencesService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    /**
     * Update user preferences
     */
    @PutMapping
    public ResponseEntity<UserPreferences> updatePreferences(
        @RequestBody UserPreferences preferences,
        @RequestHeader("X-User-Email") String userEmail
    ) {
        Long userId = extractUserId(userEmail);
        UserPreferences updated = preferencesService.updatePreferences(userId, preferences);
        return ResponseEntity.ok(updated);
    }

    private Long extractUserId(String email) {
        if (email == null || email.contains("@guest.newtab")) {
            return null;
        }
        try {
            return Long.parseLong(email.split("@")[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
```

### Frontend Theme Management

**Theme Provider:**

**File:** `/apps/fe/newtab/src/components/ThemeProvider.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react'
import { UserPreferences } from '../types'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', effectiveTheme)

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme, effectiveTheme])

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Calculate effective theme
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setEffectiveTheme(prefersDark ? 'dark' : 'light')
    } else {
      setEffectiveTheme(theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

### CSS Variables for Themes

**File:** `/apps/fe/newtab/src/index.css`

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #000000;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #0066cc;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --border-color: #404040;
  --accent-color: #4dabf7;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: background-color 0.3s, color 0.3s;
}
```

## Verification Checklist

After completing Phase 6:

- [ ] Sponsor rotation service implements random selection
- [ ] Search history CRUD operations working
- [ ] Guest users can use autocomplete (no history)
- [ ] Authenticated users have persistent history
- [ ] News feed fetches from RSS and caches
- [ ] Background job runs every 30 minutes
- [ ] User preferences saved and loaded
- [ ] Theme switching works (light/dark/auto)
- [ ] Visibility toggles control components
- [ ] All features integrated with frontend

## Testing

### Manual Testing

```bash
# Test sponsor rotation
curl http://localhost:8082/api/sponsors/random
curl http://localhost:8082/api/sponsors/random
curl http://localhost:8082/api/sponsors/random

# Test search history
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:8082/api/history \
  -H "Content-Type: application/json" \
  -d '{"query":"test search"}'

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8082/api/history

# Test news
curl http://localhost:8082/api/news

# Test preferences
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8082/api/preferences

curl -H "Authorization: Bearer $TOKEN" \
  -X PUT http://localhost:8082/api/preferences \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","showNews":false}'
```

## Next Steps

Proceed to [Phase 7: NX Workspace Configuration](./07-nx-workspace.md)
