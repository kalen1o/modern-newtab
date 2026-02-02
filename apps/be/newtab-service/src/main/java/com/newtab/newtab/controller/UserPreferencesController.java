package com.newtab.newtab.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newtab.newtab.dto.UserPreferencesRequest;
import com.newtab.newtab.entity.UserPreferences;
import com.newtab.newtab.service.UserPreferencesService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/preferences")
@Tag(name = "User Preferences", description = "User preferences and settings management")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user preferences", description = "Retrieves preferences for a specific user, creates defaults if not exist")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences retrieved", content = @Content(schema = @Schema(implementation = UserPreferences.class)))
    })
    public ResponseEntity<UserPreferences> getPreferences(
            @Parameter(description = "User ID", required = true) @PathVariable java.util.UUID userId) {
        UserPreferences preferences = userPreferencesService.getPreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping
    @Operation(summary = "Update user preferences", description = "Updates preferences for a user, creates if not exist")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Preferences updated successfully", content = @Content(schema = @Schema(implementation = UserPreferences.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<UserPreferences> updatePreferences(@Valid @RequestBody UserPreferencesRequest request) {
        UserPreferences preferences = userPreferencesService.updatePreferences(request);
        return ResponseEntity.ok(preferences);
    }
}
