package com.newtab.newtab.controller;

import com.newtab.newtab.dto.SearchHistoryRequest;
import com.newtab.newtab.entity.SearchHistory;
import com.newtab.newtab.service.SearchHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@Tag(name = "Search History", description = "User search history management")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    public SearchHistoryController(SearchHistoryService searchHistoryService) {
        this.searchHistoryService = searchHistoryService;
    }

    @PostMapping
    @Operation(summary = "Save search", description = "Saves a search query to user's history")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search saved successfully", content = @Content(schema = @Schema(implementation = SearchHistory.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<SearchHistory> saveSearch(@Valid @RequestBody SearchHistoryRequest request) {
        SearchHistory saved = searchHistoryService.saveSearch(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user history", description = "Retrieves search history for a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search history retrieved", content = @Content(schema = @Schema(implementation = SearchHistory.class)))
    })
    public ResponseEntity<List<SearchHistory>> getUserHistory(
            @Parameter(description = "User ID", required = true) @PathVariable Integer userId) {
        List<SearchHistory> history = searchHistoryService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete history entry", description = "Deletes a specific search history entry")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "History entry deleted successfully"),
            @ApiResponse(responseCode = "404", description = "History entry not found")
    })
    public ResponseEntity<Void> deleteHistory(
            @Parameter(description = "History entry ID", required = true) @PathVariable Long id) {
        searchHistoryService.deleteHistory(id);
        return ResponseEntity.noContent().build();
    }
}
