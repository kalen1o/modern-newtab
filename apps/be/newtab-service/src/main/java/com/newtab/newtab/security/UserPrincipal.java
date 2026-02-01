package com.newtab.newtab.security;

import java.io.Serializable;

public class UserPrincipal implements Serializable {
    private final String email;
    private final String userType;

    public UserPrincipal(String email, String userType) {
        this.email = email;
        this.userType = userType;
    }

    public String getEmail() {
        return email;
    }

    public String getUserType() {
        return userType;
    }

    public boolean isRegistered() {
        return "registered".equals(userType);
    }
}
