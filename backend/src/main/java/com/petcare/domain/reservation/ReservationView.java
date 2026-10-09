package com.petcare.domain.reservation;

import java.util.EnumSet;
import java.util.Set;

/**
 * "내 예약" 화면의 보기 구분. 상태만으로는 못 나눔 — 확정된 예약도 시간이 지나면 "지난 예약"이라 슬롯 시작 시간도 같이 봄.
 * 다가오는 예약만 가까운 순, 나머지는 최근 순(ReservationService).
 */
public enum ReservationView {
	ALL(EnumSet.allOf(ReservationStatus.class), Timing.ANY),
	UPCOMING(EnumSet.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED), Timing.FUTURE),
	// 병원이 확정하지 않은 채 시간이 지나버린 대기 예약도 여기
	PAST(EnumSet.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.NO_SHOW), Timing.STARTED),
	CANCELLED(EnumSet.of(ReservationStatus.CANCELLED, ReservationStatus.REJECTED), Timing.ANY);

	enum Timing { ANY, FUTURE, STARTED }

	private final Set<ReservationStatus> statuses;
	private final Timing timing;

	ReservationView(Set<ReservationStatus> statuses, Timing timing) {
		this.statuses = statuses;
		this.timing = timing;
	}

	public Set<ReservationStatus> statuses() {
		return statuses;
	}

	Timing timing() {
		return timing;
	}
}
