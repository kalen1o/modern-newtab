package com.newtab.newtab.dto;

import com.newtab.newtab.entity.AdvertisementType;
import com.newtab.newtab.entity.SponsorPositionType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SponsorRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;

    @NotNull(message = "Advertisement type is required (IMAGE, LOOP_VIDEO, LOOP_GIF)")
    private AdvertisementType advertisementType;

    /**
     * Position: FULL_BACKGROUND or WINDOW (window under Autocomplete). Defaults to
     * WINDOW if null.
     */
    private SponsorPositionType positionType;

    @NotBlank(message = "Media URL is required")
    @Size(max = 1000, message = "Media URL must be less than 1000 characters")
    private String mediaUrl;

    @Size(max = 1000, message = "Link URL must be less than 1000 characters")
    private String linkUrl;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public AdvertisementType getAdvertisementType() {
        return advertisementType;
    }

    public void setAdvertisementType(AdvertisementType advertisementType) {
        this.advertisementType = advertisementType;
    }

    public SponsorPositionType getPositionType() {
        return positionType;
    }

    public void setPositionType(SponsorPositionType positionType) {
        this.positionType = positionType;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
