package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordType;
import java.time.LocalDate;

// 변경(2026-10-05): hospitalName 추가 — 병원이 작성한 진료 기록이면 병원 이름, 보호자가 쓴 기록이면 null
// (이전: 작성 주체 구분 없음). 프론트는 이 값으로 "병원 작성" 표시 + 수정/삭제 버튼 숨김
public record HealthRecordResponse(
		Long id, Long petId, HealthRecordType type, LocalDate recordedAt, String content, Double weight,
		LocalDate nextDueDate, String hospitalName) {

	public static HealthRecordResponse from(HealthRecord record) {
		return new HealthRecordResponse(
				record.getId(), record.getPet().getId(), record.getType(), record.getRecordedAt(),
				record.getContent(), record.getWeight(), record.getNextDueDate(),
				record.isWrittenByHospital() ? record.getReservation().getSlot().getHospital().getName() : null);
	}
}
