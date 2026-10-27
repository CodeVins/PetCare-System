package com.petcare.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record KakaoLoginRequest(
		@NotBlank(message = "인가 코드가 없습니다.") String code
) {
}
