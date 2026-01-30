package com.newtab.newtab.controller;

import com.newtab.newtab.dto.SponsorRequest;
import com.newtab.newtab.entity.Sponsor;
import com.newtab.newtab.service.SponsorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sponsors")
public class SponsorController {

    private final SponsorService sponsorService;

    public SponsorController(SponsorService sponsorService) {
        this.sponsorService = sponsorService;
    }

    @PostMapping
    public ResponseEntity<Sponsor> createSponsor(@Valid @RequestBody SponsorRequest request) {
        Sponsor sponsor = sponsorService.createSponsor(request);
        return ResponseEntity.ok(sponsor);
    }

    @GetMapping("/random")
    public ResponseEntity<Sponsor> getRandomSponsor() {
        Sponsor sponsor = sponsorService.getRandomSponsor();
        if (sponsor == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(sponsor);
    }

    @GetMapping
    public ResponseEntity<List<Sponsor>> getAllSponsors() {
        List<Sponsor> sponsors = sponsorService.getAllSponsors();
        return ResponseEntity.ok(sponsors);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sponsor> updateSponsor(@PathVariable Long id, @Valid @RequestBody SponsorRequest request) {
        Sponsor sponsor = sponsorService.updateSponsor(id, request);
        return ResponseEntity.ok(sponsor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSponsor(@PathVariable Long id) {
        sponsorService.deleteSponsor(id);
        return ResponseEntity.noContent().build();
    }
}
