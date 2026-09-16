package com.petcare.domain.user.dto;

public record TokenResponse(String accessToken, long expiresIn) {
}
