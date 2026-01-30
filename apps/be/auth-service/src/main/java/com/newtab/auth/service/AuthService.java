package com.newtab.auth.service;

import com.newtab.auth.dto.AuthResponse;
import com.newtab.auth.dto.LoginRequest;
import com.newtab.auth.dto.RegisterRequest;
import com.newtab.auth.entity.User;
import com.newtab.auth.repository.UserRepository;
import com.newtab.auth.security.JwtProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtProvider jwtProvider) {
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getEmail());
        return new AuthResponse(token, token); // Same token for refresh for simplicity
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtProvider.generateToken(user.getEmail());
        return new AuthResponse(token, token);
    }

    public AuthResponse refreshToken(String email) {
        String token = jwtProvider.generateToken(email);
        return new AuthResponse(token, token);
    }

    public AuthResponse guestToken() {
        String guestEmail = "guest-" + System.currentTimeMillis() + "@guest.newtab";
        String token = jwtProvider.generateToken(guestEmail);
        return new AuthResponse(token, token);
    }

    public String validateToken(String token) {
        if (!jwtProvider.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }
        return jwtProvider.getEmailFromToken(token);
    }
}
