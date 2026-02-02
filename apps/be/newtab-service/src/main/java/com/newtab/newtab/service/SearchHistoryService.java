package com.newtab.newtab.service;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import com.newtab.newtab.dto.SearchHistoryRequest;
import com.newtab.newtab.entity.SearchHistory;
import com.newtab.newtab.repository.SearchHistoryRepository;
import com.newtab.newtab.repository.UserRepository;

@Service
public class SearchHistoryService {

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    public SearchHistoryService(SearchHistoryRepository searchHistoryRepository, UserRepository userRepository) {
        this.searchHistoryRepository = searchHistoryRepository;
        this.userRepository = userRepository;
    }

    private java.util.UUID getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getId())
                .orElse(null);
    }

    public SearchHistory saveSearch(SearchHistoryRequest request, String userEmail) {
        java.util.UUID userId = getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new RuntimeException("User not found: " + userEmail);
        }

        SearchHistory searchHistory = new SearchHistory();
        searchHistory.setUserId(userId);
        searchHistory.setQuery(request.getQuery());
        return searchHistoryRepository.save(searchHistory);
    }

    public List<SearchHistory> getUserHistory(String userEmail) {
        java.util.UUID userId = getUserIdByEmail(userEmail);
        if (userId == null) {
            return List.of();
        }

        List<SearchHistory> allHistory = searchHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        // Get only the 5 latest unique queries while preserving order
        LinkedHashSet<String> seenQueries = new LinkedHashSet<>();
        return allHistory.stream()
                .filter(history -> seenQueries.add(history.getQuery()))
                .limit(5)
                .toList();
    }

    public void deleteHistory(java.util.UUID id) {
        searchHistoryRepository.deleteById(id);
    }
}
