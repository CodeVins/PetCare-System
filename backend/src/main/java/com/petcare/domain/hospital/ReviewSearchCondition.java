package com.petcare.domain.hospital;

import java.time.LocalDate;

// 관리 화면(리뷰 목록/신고 목록) 공용 필터 — null인 값은 조건에서 빠진다.
// managerId: HOSPITAL_OWNER면 본인 id(본인 병원만), ADMIN이면 null(전체).
// author/reporter는 이메일 부분 일치, from/to는 작성일(리뷰) 또는 신고일(신고) 기준 날짜 범위(양끝 포함).
public record ReviewSearchCondition(
		Long managerId, Long hospitalId, String author, String reporter, LocalDate from, LocalDate to,
		Boolean hidden) {
}
