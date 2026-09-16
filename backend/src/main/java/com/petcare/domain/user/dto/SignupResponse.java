package com.petcare.domain.user.dto;

import com.petcare.domain.user.User;

public record SignupResponse(Long id, String email) {

	public static SignupResponse from(User user) {
		return new SignupResponse(user.getId(), user.getEmail());
	}
}
