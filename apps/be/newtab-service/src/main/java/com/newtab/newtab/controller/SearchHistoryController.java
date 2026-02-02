package com.newtab.newtab.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newtab.newtab.dto.SearchHistoryRequest;
import com.newtab.newtab.entity.SearchHistory;
import com.newtab.newtab.security.UserPrincipal;
import com.newtab.newtab.service.SearchHistoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/history")
@Tag(name = "Search History", description = "User search history management (registered users only)")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    public SearchHistoryController(SearchHistoryService searchHistoryService) {
        this.searchHistoryService = searchHistoryService;
    }

    private UserPrincipal getUserPrincipal(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal) {
            return (UserPrincipal) principal;
        }
        return null;
    }

    private void requireRegisteredUser(Authentication authentication) {
        UserPrincipal userPrincipal = getUserPrincipal(authentication);
        if (userPrincipal == null || !userPrincipal.isRegistered()) {
            throw new RuntimeException("History features are only available for registered users");
        }
    }

    @PostMapping
    @Operation(summary = "Save search", description = "Saves a search query to user's history (registered users only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search saved successfully", content = @Content(schema = @Schema(implementation = SearchHistory.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "403", description = "Guest users cannot save search history")
    })
    public ResponseEntity<SearchHistory> saveSearch(
            @Valid @RequestBody SearchHistoryRequest request,
            Authentication authentication) {
        requireRegisteredUser(authentication);
        UserPrincipal userPrincipal = getUserPrincipal(authentication);
        SearchHistory saved = searchHistoryService.saveSearch(request, userPrincipal.getEmail());
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    @Operation(summary = "Get user history", description = "Retrieves search history for the authenticated user (registered users only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Search history retrieved", content = @Content(schema = @Schema(implementation = SearchHistory.class))),
            @ApiResponse(responseCode = "403", description = "Guest users cannot access search history")
    })
    public ResponseEntity<Map<String, List<SearchHistory>>> getUserHistory(Authentication authentication) {
        requireRegisteredUser(authentication);
        UserPrincipal userPrincipal = getUserPrincipal(authentication);
        List<SearchHistory> history = searchHistoryService.getUserHistory(userPrincipal.getEmail());
        Map<String, List<SearchHistory>> response = Map.of("items", history);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete history entry", description = "Deletes a specific search history entry (registered users only)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "History entry deleted successfully"),
            @ApiResponse(responseCode = "404", description = "History entry not found"),
            @ApiResponse(responseCode = "403", description = "Guest users cannot delete search history")
    })
    public ResponseEntity<Void> deleteHistory(
            @Parameter(description = "History entry ID", required = true) @PathVariable UUID id,
            Authentication authentication) {
        requireRegisteredUser(authentication);
        searchHistoryService.deleteHistory(id);
        return ResponseEntity.noContent().build();
    }
}
