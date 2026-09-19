package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.HospitalStatsResponse;
import com.petcare.domain.admin.dto.StatsSummaryResponse;
import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

	private final UserRepository userRepository;
	private final PetRepository petRepository;
	private final HospitalRepository hospitalRepository;
	private final ReservationRepository reservationRepository;
	private final ReviewRepository reviewRepository;

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

	private HospitalStatsResponse toHospitalStats(Hospital hospital) {
		long reservationCount =
				reservationRepository.countBySlot_Hospital_IdAndStatus(hospital.getId(), ReservationStatus.CONFIRMED);
		long reviewCount = reviewRepository.countByHospitalIdAndHiddenFalse(hospital.getId());
		Double averageRating = reviewRepository.findAverageRatingByHospitalId(hospital.getId());

		return new HospitalStatsResponse(hospital.getId(), hospital.getName(), reservationCount, reviewCount, averageRating);
	}
}
