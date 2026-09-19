package com.petcare.domain.healthcheck.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerItem(
		@NotBlank(message = "questionId가 필요합니다.") String questionId,
		@NotBlank(message = "optionId가 필요합니다.") String optionId
) {
}
