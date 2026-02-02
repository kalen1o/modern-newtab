package com.newtab.newtab.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newtab.newtab.dto.SponsorRequest;
import com.newtab.newtab.entity.Sponsor;
import com.newtab.newtab.service.SponsorService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sponsors")
@Tag(name = "Sponsors", description = "Sponsor management and rotation")
public class SponsorController {

    private final SponsorService sponsorService;

    public SponsorController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }

    @PostMapping
    @Operation(summary = "Create sponsor", description = "Creates a new sponsor entry")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sponsor created successfully", content = @Content(schema = @Schema(implementation = Sponsor.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    public ResponseEntity<Sponsor> createSponsor(@Valid @RequestBody SponsorRequest request) {
        Sponsor sponsor = sponsorService.createSponsor(request);
        return ResponseEntity.ok(sponsor);
    }

    @GetMapping("/random")
    @Operation(summary = "Get random sponsor", description = "Returns a randomly selected active sponsor for display")
    @ApiResponse(responseCode = "200", description = "Random sponsor returned", content = @Content(schema = @Schema(implementation = Sponsor.class)))
    @ApiResponse(responseCode = "204", description = "No active sponsors available")
    public ResponseEntity<Sponsor> getRandomSponsor() {
        Sponsor sponsor = sponsorService.getRandomSponsor();
        if (sponsor == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(sponsor);
    }

    @GetMapping
    @Operation(summary = "Get all sponsors", description = "Returns list of all active sponsors")
    @ApiResponse(responseCode = "200", description = "List of sponsors", content = @Content(schema = @Schema(implementation = Sponsor.class)))
    public ResponseEntity<List<Sponsor>> getAllSponsors() {
        List<Sponsor> sponsors = sponsorService.getAllSponsors();
        return ResponseEntity.ok(sponsors);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update sponsor", description = "Updates an existing sponsor")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sponsor updated successfully", content = @Content(schema = @Schema(implementation = Sponsor.class))),
            @ApiResponse(responseCode = "404", description = "Sponsor not found")
    })
    public ResponseEntity<Sponsor> updateSponsor(
            @Parameter(description = "Sponsor ID", required = true) @PathVariable java.util.UUID id,
            @Valid @RequestBody SponsorRequest request) {
        Sponsor sponsor = sponsorService.updateSponsor(id, request);
        return ResponseEntity.ok(sponsor);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete sponsor", description = "Deletes a sponsor")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Sponsor deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Sponsor not found")
    })
    public ResponseEntity<Void> deleteSponsor(
            @Parameter(description = "Sponsor ID", required = true) @PathVariable java.util.UUID id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.noContent().build();
    }
}
