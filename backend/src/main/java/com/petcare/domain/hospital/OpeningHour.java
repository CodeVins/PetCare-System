package com.petcare.domain.hospital;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.DayOfWeek;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 요일별 진료 시간 한 구간 [openTime, closeTime). 하루에 여러 구간 가능(점심시간으로 나누는 경우).
 * ponytail: 자정을 넘기는 구간(22:00~02:00)은 지원 안 함 — 그런 병원은 24시간 플래그 사용, 필요해지면 다음 날로 나눠 저장
 */
@Getter
@Embeddable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OpeningHour {

	@Enumerated(EnumType.STRING)
	@Column(name = "day_of_week", nullable = false, columnDefinition = "varchar(10)")
	private DayOfWeek dayOfWeek;

	@Column(name = "open_time", nullable = false)
	private LocalTime openTime;

	@Column(name = "close_time", nullable = false)
	private LocalTime closeTime;

	public OpeningHour(DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime) {
		this.dayOfWeek = dayOfWeek;
		this.openTime = openTime;
		this.closeTime = closeTime;
	}

	public boolean covers(DayOfWeek day, LocalTime time) {
		return dayOfWeek == day && !time.isBefore(openTime) && time.isBefore(closeTime);
	}

	public boolean overlaps(OpeningHour other) {
		return dayOfWeek == other.dayOfWeek && openTime.isBefore(other.closeTime) && other.openTime.isBefore(closeTime);
	}
}
