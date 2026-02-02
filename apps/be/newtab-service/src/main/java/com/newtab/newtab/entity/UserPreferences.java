package com.newtab.newtab.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", unique = true)
    private UUID userId;

    @Column
    private String theme = "light";

    @Column(name = "background_type")
    private String backgroundType = "image";

    @Column(name = "show_news")
    private Boolean showNews = true;

    @Column(name = "show_sponsors")
    private Boolean showSponsors = true;

    @Column(name = "show_history")
    private Boolean showHistory = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getBackgroundType() {
        return backgroundType;
    }

    public void setBackgroundType(String backgroundType) {
        this.backgroundType = backgroundType;
    }

    public Boolean getShowNews() {
        return showNews;
    }

    public void setShowNews(Boolean showNews) {
        this.showNews = showNews;
    }

    public Boolean getShowSponsors() {
        return showSponsors;
    }

    public void setShowSponsors(Boolean showSponsors) {
        this.showSponsors = showSponsors;
    }

    public Boolean getShowHistory() {
        return showHistory;
    }

    public void setShowHistory(Boolean showHistory) {
        this.showHistory = showHistory;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
