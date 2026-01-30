package com.newtab.newtab.repository;

import com.newtab.newtab.entity.NewsArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    List<NewsArticle> findTop20ByOrderByPublishedAtDesc();
}
