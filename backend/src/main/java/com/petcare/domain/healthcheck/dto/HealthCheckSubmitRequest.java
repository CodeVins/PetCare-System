package com.petcare.domain.healthcheck.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record HealthCheckSubmitRequest(
		@NotNull(message = "petId가 필요합니다.") Long petId,
		@NotEmpty(message = "답변이 필요합니다.") @Valid List<AnswerItem> answers,
		Boolean saveRecord
) {
}
