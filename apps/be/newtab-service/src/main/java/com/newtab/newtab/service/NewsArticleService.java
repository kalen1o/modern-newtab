package com.newtab.newtab.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.newtab.newtab.dto.PageResponse;
import com.newtab.newtab.entity.NewsArticle;
import com.newtab.newtab.repository.NewsArticleRepository;

@Service
public class NewsArticleService {

    private final NewsArticleRepository newsArticleRepository;

    public NewsArticleService(NewsArticleRepository newsArticleRepository) {
        this.newsArticleRepository = newsArticleRepository;
    }

    public PageResponse<NewsArticle> getRecentNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("publishedAt").descending());
        Page<NewsArticle> resultPage = newsArticleRepository.findAllByOrderByPublishedAtDesc(pageable);

        return new PageResponse<>(
                resultPage.getContent(),
                resultPage.getNumber(),
                resultPage.getSize(),
                resultPage.getTotalElements(),
                resultPage.getTotalPages());
    }

    public NewsArticle saveArticle(NewsArticle article) {
        return newsArticleRepository.save(article);
    }

    public void deleteArticle(java.util.UUID id) {
        newsArticleRepository.deleteById(id);
    }
}
