package com.newtab.newtab.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public class UserPreferencesRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;

    private String theme;
    private String backgroundType;
    private Boolean showNews;
    private Boolean showSponsors;
    private Boolean showHistory;

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
}
