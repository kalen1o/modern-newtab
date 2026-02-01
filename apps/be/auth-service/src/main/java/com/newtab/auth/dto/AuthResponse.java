package com.newtab.auth.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private String userType; // "guest" or "registered"

    public AuthResponse(String token, String refreshToken, String userType) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userType = userType;
    }

    public String getToken() {
        return token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getType() {
        return type;
    }

    public String getUserType() {
        return userType;
    }
}
