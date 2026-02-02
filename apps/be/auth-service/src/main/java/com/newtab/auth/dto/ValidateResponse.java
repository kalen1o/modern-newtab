package com.newtab.auth.dto;

public class ValidateResponse {
    private final String email;
    private final String userType;

    public ValidateResponse(String email, String userType) {
        this.email = email;
        this.userType = userType != null ? userType : "guest";
    }

    public String getEmail() {
        return email;
    }

    public String getUserType() {
        return userType;
    }
}
