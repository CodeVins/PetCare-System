package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.HospitalPeriodStatsResponse;
import com.petcare.domain.admin.dto.HospitalStatsResponse;
import com.petcare.domain.admin.dto.StatsSummaryResponse;
import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.hospital.HospitalService;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ForbiddenException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

	private static final Set<Integer> ALLOWED_DAYS = Set.of(7, 30, 90);

	private final UserRepository userRepository;
	private final PetRepository petRepository;
	private final HospitalRepository hospitalRepository;
	private final ReservationRepository reservationRepository;
	private final ReviewRepository reviewRepository;
	private final SlotRepository slotRepository;
	private final HospitalService hospitalService;

	public StatsSummaryResponse getSummary() {
		return new StatsSummaryResponse(
				userRepository.count(),
				petRepository.count(),
				hospitalRepository.count(),
				reservationRepository.count(),
				reservationRepository.countByStatus(ReservationStatus.CONFIRMED),
				reservationRepository.countByStatus(ReservationStatus.CANCELLED),
				reservationRepository.countByStatus(ReservationStatus.NO_SHOW)
		);
	}

	public List<HospitalStatsResponse> getHospitalStats() {
		return hospitalRepository.findAll().stream()
				.map(this::toHospitalStats)
				.toList();
	}

	// 병원 소유자 대시보드 "통계" — 최근 days일(오늘 포함). ADMIN은 모든 병원, 소유자는 본인 병원만
	public HospitalPeriodStatsResponse getHospitalPeriodStats(User currentUser, Long hospitalId, int days) {
		if (!ALLOWED_DAYS.contains(days)) {
			throw new BadRequestException("기간은 7일, 30일, 90일 중에서 선택해주세요.");
		}
		Hospital hospital = hospitalService.findHospital(hospitalId);
		if (!hospital.isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원의 통계를 볼 권한이 없습니다.");
		}

		LocalDate to = LocalDate.now();
		LocalDate from = to.minusDays(days - 1L);
		LocalDateTime start = from.atStartOfDay();
		LocalDateTime end = to.plusDays(1).atStartOfDay();
		LocalDateTime now = LocalDateTime.now();
		List<Reservation> reservations = reservationRepository.findAllForStats(hospitalId, start, end);

		Map<ReservationStatus, Long> byStatus = new EnumMap<>(ReservationStatus.class);
		for (ReservationStatus status : ReservationStatus.values()) {
			byStatus.put(status, 0L);
		}
		Map<ReservationType, Long> byType = new EnumMap<>(ReservationType.class);
		Map<LocalDate, long[]> daily = new TreeMap<>();
		for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
			daily.put(date, new long[2]);
		}
		long attended = 0;
		long noShow = 0;
		for (Reservation reservation : reservations) {
			ReservationStatus status = reservation.getStatus();
			byStatus.merge(status, 1L, Long::sum);
			if (reservation.getType() != null) {
				byType.merge(reservation.getType(), 1L, Long::sum);
			}
			boolean cancelled = status == ReservationStatus.CANCELLED || status == ReservationStatus.REJECTED;
			daily.get(reservation.getSlot().getStartTime().toLocalDate())[cancelled ? 1 : 0]++;
			if (reservation.getSlot().getStartTime().isBefore(now)) {
				if (status == ReservationStatus.CONFIRMED) {
					attended++;
				} else if (status == ReservationStatus.NO_SHOW) {
					noShow++;
				}
			}
		}

		List<Slot> slots = slotRepository.findAllByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
				hospitalId, end, start);
		long reservedSlots = slots.stream().filter(slot -> !slot.isAvailable()).count();

		return new HospitalPeriodStatsResponse(
				hospital.getId(), hospital.getName(), from, to, reservations.size(), byStatus, byType,
				ratio(noShow, attended + noShow),
				ratio(byStatus.get(ReservationStatus.CANCELLED), reservations.size()),
				slots.size(), reservedSlots,
				daily.entrySet().stream()
						.map(entry -> new HospitalPeriodStatsResponse.DailyCount(
								entry.getKey(), entry.getValue()[0], entry.getValue()[1]))
						.toList());
	}

	private Double ratio(long numerator, long denominator) {
		return denominator == 0 ? null : (double) numerator / denominator;
	}

	private HospitalStatsResponse toHospitalStats(Hospital hospital) {
		long reservationCount =
				reservationRepository.countBySlot_Hospital_IdAndStatus(hospital.getId(), ReservationStatus.CONFIRMED);
		long reviewCount = reviewRepository.countByHospitalIdAndHiddenFalse(hospital.getId());
		Double averageRating = reviewRepository.findAverageRatingByHospitalId(hospital.getId());

		return new HospitalStatsResponse(hospital.getId(), hospital.getName(), reservationCount, reviewCount, averageRating);
	}
}
