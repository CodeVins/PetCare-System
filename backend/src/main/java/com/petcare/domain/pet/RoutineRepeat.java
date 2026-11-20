package com.petcare.domain.pet;

// 루틴 반복 주기 — WEEKLY/BIWEEKLY는 고른 요일에, MONTHLY는 매월 시작일과 같은 날(그 달에 없으면 말일)
public enum RoutineRepeat {
	WEEKLY,
	// 시작일이 속한 주부터 2주마다
	BIWEEKLY,
	MONTHLY
}
