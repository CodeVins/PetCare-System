package com.petcare.domain.admin.dto;

import jakarta.validation.constraints.NotNull;

public record HospitalOwnerUpdateRequest(
		@NotNull(message = "소유자를 선택해주세요.") Long ownerId
) {
}
