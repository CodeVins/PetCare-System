package com.petcare.domain.hospital.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewReplyRequest(@NotBlank(message = "답글 내용을 입력해주세요.") String content) {
}
