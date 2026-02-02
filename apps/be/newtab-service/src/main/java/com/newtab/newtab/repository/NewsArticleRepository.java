package com.newtab.newtab.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.newtab.newtab.entity.NewsArticle;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, UUID> {
    Page<NewsArticle> findAllByOrderByPublishedAtDesc(Pageable pageable);
}
