package com.petcare.domain.pet;

public enum HealthRecordType {
	WEIGHT,
	VACCINATION,
	TREATMENT,
	WALK,
	MEAL,
	EXCRETION,
	HEALTH_CHECK,
	// 변경(2026-10-31): 투약·미용 추가 — 루틴(PetRoutine) 완료 체크를 건강 기록으로 남기려고, 직접 기록도 가능
	// (이전: 7종. 투약은 진료로, 미용은 기록할 곳이 없었음)
	MEDICATION,
	GROOMING
}
