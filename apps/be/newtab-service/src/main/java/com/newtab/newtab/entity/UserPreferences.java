package com.newtab.newtab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Integer userId;

    @Column
    private String theme;

    @Column(name = "background_type")
    private String backgroundType;

    @Column(name = "show_news")
    private Boolean showNews;

    @Column(name = "show_sponsors")
    private Boolean showSponsors;

    @Column(name = "show_history")
    private Boolean showHistory;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        setDefaults();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private void setDefaults() {
        if (theme == null) theme = "light";
        if (backgroundType == null) backgroundType = "image";
        if (showNews == null) showNews = true;
        if (showSponsors == null) showSponsors = true;
        if (showHistory == null) showHistory = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getBackgroundType() { return backgroundType; }
    public void setBackgroundType(String backgroundType) { this.backgroundType = backgroundType; }

    public Boolean getShowNews() { return showNews; }
    public void setShowNews(Boolean showNews) { this.showNews = showNews; }

    public Boolean getShowSponsors() { return showSponsors; }
    public void setShowSponsors(Boolean showSponsors) { this.showSponsors = showSponsors; }

    public Boolean getShowHistory() { return showHistory; }
    public void setShowHistory(Boolean showHistory) { this.showHistory = showHistory; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
