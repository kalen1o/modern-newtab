package com.newtab.newtab.service;

import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.newtab.newtab.dto.SponsorRequest;
import com.newtab.newtab.entity.Sponsor;
import com.newtab.newtab.repository.SponsorRepository;

@Service
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final Random random = new Random();

    public SponsorService(SponsorRepository sponsorRepository) {
        this.sponsorRepository = sponsorRepository;
    }

    public Sponsor createSponsor(SponsorRequest request) {
        Sponsor sponsor = new Sponsor();
        sponsor.setName(request.getName());
        sponsor.setAdvertisementType(request.getAdvertisementType());
        sponsor.setPositionType(request.getPositionType() != null ? request.getPositionType()
                : com.newtab.newtab.entity.SponsorPositionType.WINDOW);
        sponsor.setMediaUrl(request.getMediaUrl());
        sponsor.setLinkUrl(request.getLinkUrl());
        sponsor.setIsActive(request.getIsActive());
        return sponsorRepository.save(sponsor);
    }

    public Sponsor getRandomSponsor() {
        List<Sponsor> activeSponsors = sponsorRepository.findByIsActiveTrue();
        if (activeSponsors.isEmpty()) {
            return null;
        }
        return activeSponsors.get(random.nextInt(activeSponsors.size()));
    }

    public List<Sponsor> getAllSponsors() {
        return sponsorRepository.findByIsActiveTrue();
    }

    public Sponsor updateSponsor(java.util.UUID id, SponsorRequest request) {
        Sponsor sponsor = sponsorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sponsor not found"));

        sponsor.setName(request.getName());
        sponsor.setAdvertisementType(request.getAdvertisementType());
        sponsor.setPositionType(request.getPositionType() != null ? request.getPositionType()
                : com.newtab.newtab.entity.SponsorPositionType.WINDOW);
        sponsor.setMediaUrl(request.getMediaUrl());
        sponsor.setLinkUrl(request.getLinkUrl());
        sponsor.setIsActive(request.getIsActive());

        return sponsorRepository.save(sponsor);
    }

    public void deleteSponsor(java.util.UUID id) {
        sponsorRepository.deleteById(id);
    }
}
