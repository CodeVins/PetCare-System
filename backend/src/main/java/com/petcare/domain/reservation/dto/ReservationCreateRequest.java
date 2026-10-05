package com.petcare.domain.reservation.dto;

import com.petcare.domain.reservation.ReservationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 변경(2026-10-05): memo(증상·요청 메모)와 healthCheckRecordId(첨부할 자가 문진 기록) 추가 — 둘 다 선택
// (이전: 펫·슬롯·진료 종류만)
public record ReservationCreateRequest(
		@NotNull(message = "반려동물을 선택해주세요.") Long petId,
		@NotNull(message = "예약 시간을 선택해주세요.") Long slotId,
		@NotNull(message = "진료 종류를 선택해주세요.") ReservationType type,
		@Size(max = 500, message = "메모는 500자 이하로 입력해주세요.") String memo,
		Long healthCheckRecordId
) {
}
