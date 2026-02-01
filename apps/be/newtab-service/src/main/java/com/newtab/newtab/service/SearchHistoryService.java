package com.newtab.newtab.service;

import com.newtab.newtab.dto.SearchHistoryRequest;
import com.newtab.newtab.entity.SearchHistory;
import com.newtab.newtab.repository.SearchHistoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SearchHistoryService {

    private final SearchHistoryRepository searchHistoryRepository;

    public SearchHistoryService(SearchHistoryRepository searchHistoryRepository) {
        this.searchHistoryRepository = searchHistoryRepository;
    }

    public SearchHistory saveSearch(SearchHistoryRequest request, String userEmail) {
        SearchHistory searchHistory = new SearchHistory();
        searchHistory.setUserEmail(userEmail);
        searchHistory.setQuery(request.getQuery());
        return searchHistoryRepository.save(searchHistory);
    }

    public List<SearchHistory> getUserHistory(String userEmail) {
        return searchHistoryRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public void deleteHistory(Long id) {
        searchHistoryRepository.deleteById(id);
    }
}
