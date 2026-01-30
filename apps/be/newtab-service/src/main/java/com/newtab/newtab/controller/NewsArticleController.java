package com.newtab.newtab.controller;

import com.newtab.newtab.dto.PageResponse;
import com.newtab.newtab.entity.NewsArticle;
import com.newtab.newtab.service.NewsArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/news")
@Tag(name = "News Articles", description = "News article caching and management")
public class NewsArticleController {

    private final NewsArticleService newsArticleService;

    public NewsArticleController(NewsArticleService newsArticleService) {
        this.newsArticleService = newsArticleService;
    }

    @GetMapping
    @Operation(summary = "Get recent news with pagination", description = "Retrieves news articles with pagination")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "News articles retrieved", content = @Content(schema = @Schema(implementation = PageResponse.class)))
    })
    public ResponseEntity<PageResponse<NewsArticle>> getRecentNews(
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size) {
        PageResponse<NewsArticle> response = newsArticleService.getRecentNews(page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Save news article", description = "Saves or updates a news article")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Article saved successfully", content = @Content(schema = @Schema(implementation = NewsArticle.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<NewsArticle> saveArticle(@RequestBody NewsArticle article) {
        NewsArticle saved = newsArticleService.saveArticle(article);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete news article", description = "Deletes a news article")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Article deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Article not found")
    })
    public ResponseEntity<Void> deleteArticle(
            @Parameter(description = "Article ID", required = true) @PathVariable Long id) {
        newsArticleService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }
}
