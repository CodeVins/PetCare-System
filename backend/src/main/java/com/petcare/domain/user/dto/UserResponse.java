package com.petcare.domain.user.dto;

import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;

public record UserResponse(Long id, String email, Role role, boolean suspended) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getRole(), user.isSuspended());
	}
}
