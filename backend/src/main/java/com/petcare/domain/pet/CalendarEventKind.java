package com.petcare.domain.pet;

public enum CalendarEventKind {
	// 병원 예약(대기·확정·노쇼) — 슬롯 시작 시각
	RESERVATION,
	// 건강·생활 기록(체중·산책·식사 등) — 기록한 날
	RECORD,
	// 기록에 적은 다음 접종·내원 예정일
	DUE
}
