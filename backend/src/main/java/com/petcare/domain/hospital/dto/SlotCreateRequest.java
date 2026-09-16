package com.petcare.domain.hospital.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record SlotCreateRequest(
		@NotNull(message = "시작 시간을 입력해주세요.") @Future(message = "시작 시간은 미래여야 합니다.") LocalDateTime startTime,
		@NotNull(message = "종료 시간을 입력해주세요.") LocalDateTime endTime
) {
}
