package com.newtab.newtab.service;

import org.springframework.stereotype.Service;

import com.newtab.newtab.dto.UserPreferencesRequest;
import com.newtab.newtab.entity.UserPreferences;
import com.newtab.newtab.repository.UserPreferencesRepository;

@Service
public class UserPreferencesService {

    private final UserPreferencesRepository userPreferencesRepository;

    public UserPreferencesService(UserPreferencesRepository userPreferencesRepository) {
        this.userPreferencesRepository = userPreferencesRepository;
    }

    public UserPreferences getPreferences(java.util.UUID userId) {
        return userPreferencesRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    private UserPreferences createDefaultPreferences(java.util.UUID userId) {
        UserPreferences preferences = new UserPreferences();
        preferences.setUserId(userId);
        return userPreferencesRepository.save(preferences);
    }

    public UserPreferences updatePreferences(UserPreferencesRequest request) {
        UserPreferences preferences = userPreferencesRepository.findByUserId(request.getUserId())
                .orElseGet(() -> {
                    UserPreferences newPrefs = new UserPreferences();
                    newPrefs.setUserId(request.getUserId());
                    return newPrefs;
                });

        if (request.getTheme() != null)
            preferences.setTheme(request.getTheme());
        if (request.getBackgroundType() != null)
            preferences.setBackgroundType(request.getBackgroundType());
        if (request.getShowNews() != null)
            preferences.setShowNews(request.getShowNews());
        if (request.getShowSponsors() != null)
            preferences.setShowSponsors(request.getShowSponsors());
        if (request.getShowHistory() != null)
            preferences.setShowHistory(request.getShowHistory());

        return userPreferencesRepository.save(preferences);
    }
}
