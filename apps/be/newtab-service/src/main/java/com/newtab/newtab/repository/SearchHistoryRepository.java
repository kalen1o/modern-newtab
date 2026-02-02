package com.newtab.newtab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newtab.newtab.entity.SearchHistory;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, UUID> {
    List<SearchHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
