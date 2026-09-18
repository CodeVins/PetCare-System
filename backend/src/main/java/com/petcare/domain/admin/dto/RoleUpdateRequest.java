package com.petcare.domain.admin.dto;

import com.petcare.domain.user.Role;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(
		@NotNull(message = "역할을 선택해주세요.") Role role
) {
}
