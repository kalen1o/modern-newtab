package com.newtab.newtab.controller;

import com.newtab.newtab.dto.SearchHistoryRequest;
import com.newtab.newtab.entity.SearchHistory;
import com.newtab.newtab.service.SearchHistoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
public class SearchHistoryController {

    private final SearchHistoryService searchHistoryService;

    public SearchHistoryController(SearchHistoryService searchHistoryService) {
        this.searchHistoryService = searchHistoryService;
    }

    @PostMapping
    public ResponseEntity<SearchHistory> saveSearch(@Valid @RequestBody SearchHistoryRequest request) {
        SearchHistory saved = searchHistoryService.saveSearch(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<SearchHistory>> getUserHistory(@PathVariable Integer userId) {
        List<SearchHistory> history = searchHistoryService.getUserHistory(userId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        searchHistoryService.deleteHistory(id);
        return ResponseEntity.noContent().build();
    }
}
