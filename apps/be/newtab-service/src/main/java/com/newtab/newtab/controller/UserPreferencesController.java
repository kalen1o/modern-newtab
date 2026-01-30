package com.newtab.newtab.controller;

import com.newtab.newtab.dto.UserPreferencesRequest;
import com.newtab.newtab.entity.UserPreferences;
import com.newtab.newtab.service.UserPreferencesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserPreferences> getPreferences(@PathVariable Integer userId) {
        UserPreferences preferences = userPreferencesService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping
    public ResponseEntity<UserPreferences> updatePreferences(@Valid @RequestBody UserPreferencesRequest request) {
        UserPreferences preferences = userPreferencesService.updatePreferences(request);
        return ResponseEntity.ok(preferences);
    }
}
