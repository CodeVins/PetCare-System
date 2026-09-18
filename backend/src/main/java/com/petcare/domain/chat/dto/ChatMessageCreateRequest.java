package com.petcare.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatMessageCreateRequest(
		@NotBlank(message = "메시지 내용을 입력해주세요.") String content
) {
}
