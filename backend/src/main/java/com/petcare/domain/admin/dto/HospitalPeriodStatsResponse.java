package com.petcare.domain.admin.dto;

import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 병원 하나의 최근 N일 운영 통계(예약 시작 시간 기준, 양끝 포함).
 * noShowRate: 시간이 지난 예약 중 NO_SHOW / (CONFIRMED + NO_SHOW) — 진료 후에도 CONFIRMED가 유지되므로 지난 CONFIRMED = 내원.
 * 비율은 분모가 0이면 null(0%와 "데이터 없음"을 구분).
 */
public record HospitalPeriodStatsResponse(
		Long hospitalId,
		String hospitalName,
		LocalDate from,
		LocalDate to,
		long totalReservations,
		Map<ReservationStatus, Long> countByStatus,
		Map<ReservationType, Long> countByType,
		Double noShowRate,
		Double cancelRate,
		long slotCount,
		long reservedSlotCount,
		List<DailyCount> daily
) {

	// booked: 대기·확정·노쇼(자리를 차지한 예약), cancelled: 취소·거절
	public record DailyCount(LocalDate date, long booked, long cancelled) {
	}
}
