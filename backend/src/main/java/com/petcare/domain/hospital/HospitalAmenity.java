package com.petcare.domain.hospital;

// 병원 편의 서비스 태그 — 목록 필터·상세 배지용. 주차는 기존 hasParking 컬럼이 있어서 여기 넣지 않음
public enum HospitalAmenity {
	EMERGENCY,         // 응급 진료
	GROOMING,          // 미용
	BOARDING,          // 호텔(위탁)
	CAT_FRIENDLY,      // 고양이 전용 진료실
	HEALTH_SCREENING,  // 건강검진
	REHABILITATION     // 재활·물리치료
}
