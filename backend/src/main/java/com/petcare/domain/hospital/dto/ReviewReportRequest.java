package com.petcare.domain.hospital.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewReportRequest(@NotBlank(message = "신고 사유를 입력해주세요.") String reason) {
}
