package com.newtab.auth.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.newtab.auth.dto.AuthResponse;
import com.newtab.auth.dto.LoginRequest;
import com.newtab.auth.dto.RegisterRequest;
import com.newtab.auth.dto.ValidateResponse;
import com.newtab.auth.entity.RefreshToken;
import com.newtab.auth.entity.User;
import com.newtab.auth.repository.RefreshTokenRepository;
import com.newtab.auth.repository.UserRepository;
import com.newtab.auth.security.JwtProvider;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthService(UserRepository userRepository, JwtProvider jwtProvider,
            RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        String authToken = jwtProvider.generateToken(user.getEmail(), "registered");
        String refreshToken = createAndStoreRefreshToken(user.getEmail(), "registered");
        return new AuthResponse(authToken, refreshToken, "registered");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String authToken = jwtProvider.generateToken(user.getEmail(), "registered");
        String refreshToken = createAndStoreRefreshToken(user.getEmail(), "registered");
        return new AuthResponse(authToken, refreshToken, "registered");
    }

    @Transactional
    public AuthResponse refreshToken(String email, String userType) {
        String type = (userType != null && !userType.isEmpty()) ? userType : "guest";
        String authToken = jwtProvider.generateToken(email, type);
        String refreshToken = createAndStoreRefreshToken(email, type);
        return new AuthResponse(authToken, refreshToken, type);
    }

    @Transactional
    public AuthResponse refreshUsingRefreshToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        if (!jwtProvider.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Not a refresh token");
        }

        var storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (storedToken.isExpired()) {
            refreshTokenRepository.delete(storedToken);
            throw new RuntimeException("Refresh token expired");
        }

        String email = storedToken.getUserId();
        String userType = storedToken.getUserType();

        String newAuthToken = jwtProvider.generateToken(email, userType);
        String newRefreshToken = createAndStoreRefreshToken(email, userType);

        deleteRefreshToken(refreshToken);

        return new AuthResponse(newAuthToken, newRefreshToken, userType);
    }

    @Transactional
    public AuthResponse guestToken() {
        String guestEmail = "guest-" + UUID.randomUUID() + "@guest.newtab";
        String authToken = jwtProvider.generateToken(guestEmail, "guest");
        String refreshToken = createAndStoreRefreshToken(guestEmail, "guest");
        return new AuthResponse(authToken, refreshToken, "guest");
    }

    public ValidateResponse validateToken(String token) {
        if (!jwtProvider.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }
        String email = jwtProvider.getEmailFromToken(token);
        String userType = jwtProvider.getUserTypeFromToken(token);
        return new ValidateResponse(email, userType);
    }

    @Transactional
    public void logout(String refreshToken) {
        deleteRefreshToken(refreshToken);
    }

    private String createAndStoreRefreshToken(String email, String userType) {
        String token = jwtProvider.generateRefreshToken(email, userType);
        LocalDateTime expiryDate = calculateRefreshTokenExpiry();

        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setToken(token);
        refreshTokenEntity.setUserId(email);
        refreshTokenEntity.setUserType(userType);
        refreshTokenEntity.setExpiryDate(expiryDate);

        refreshTokenRepository.save(refreshTokenEntity);
        cleanExpiredRefreshTokens(email);

        return token;
    }

    private void deleteRefreshToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    private void cleanExpiredRefreshTokens(String userId) {
        List<RefreshToken> userTokens = refreshTokenRepository.findByUserId(userId);
        userTokens.stream()
                .filter(RefreshToken::isExpired)
                .forEach(refreshTokenRepository::delete);
    }

    private LocalDateTime calculateRefreshTokenExpiry() {
        return LocalDateTime.now().plusDays(7);
    }
}
