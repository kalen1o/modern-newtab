package com.newtab.newtab.controller;

import com.newtab.newtab.entity.NewsArticle;
import com.newtab.newtab.service.NewsArticleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsArticleController {

    private final NewsArticleService newsArticleService;

    public NewsArticleController(NewsArticleService newsArticleService) {
        this.newsArticleService = newsArticleService;
    }

    @GetMapping
    public ResponseEntity<List<NewsArticle>> getRecentNews() {
        List<NewsArticle> articles = newsArticleService.getRecentNews();
        return ResponseEntity.ok(articles);
    }

    @PostMapping
    public ResponseEntity<NewsArticle> saveArticle(@RequestBody NewsArticle article) {
        NewsArticle saved = newsArticleService.saveArticle(article);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        newsArticleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}
