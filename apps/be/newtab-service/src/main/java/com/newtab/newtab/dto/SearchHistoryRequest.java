package com.newtab.newtab.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SearchHistoryRequest {
    @NotNull(message = "User ID is required")
    private Integer userId;

    @NotBlank(message = "Query is required")
    @Size(max = 500, message = "Query must be less than 500 characters")
    private String query;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}
