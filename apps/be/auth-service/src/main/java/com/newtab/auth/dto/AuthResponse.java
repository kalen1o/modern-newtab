package com.newtab.auth.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";

    public AuthResponse(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
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
}
