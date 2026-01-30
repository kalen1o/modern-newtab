package com.newtab.newtab.service;

import com.newtab.newtab.entity.NewsArticle;
import com.newtab.newtab.repository.NewsArticleRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NewsArticleService {

    private final NewsArticleRepository newsArticleRepository;

    public NewsArticleService(NewsArticleRepository newsArticleRepository) {
        this.newsArticleRepository = newsArticleRepository;
    }

    public List<NewsArticle> getRecentNews() {
        return newsArticleRepository.findTop20ByOrderByPublishedAtDesc();
    }

    public NewsArticle saveArticle(NewsArticle article) {
        return newsArticleRepository.save(article);
    }

    public void deleteArticle(Long id) {
        newsArticleRepository.deleteById(id);
    }
}
