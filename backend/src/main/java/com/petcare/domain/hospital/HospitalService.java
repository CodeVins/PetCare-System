package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalCreateRequest;
import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.domain.hospital.dto.HospitalUpdateRequest;
import com.petcare.domain.user.User;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

	private final HospitalRepository hospitalRepository;
	private final ReviewRepository reviewRepository;

	@Transactional
	public HospitalResponse create(HospitalCreateRequest request) {
		Hospital hospital = Hospital.builder()
				.name(request.name())
				.address(request.address())
				.latitude(request.latitude())
				.longitude(request.longitude())
				.openingHours(request.openingHours())
				.specialty(request.specialty())
				.is24Hours(request.is24Hours())
				.hasParking(request.hasParking())
				.avgTreatmentPrice(request.avgTreatmentPrice())
				.build();

		return HospitalResponse.from(hospitalRepository.save(hospital));
	}

	@Transactional
	public HospitalResponse update(User currentUser, Long hospitalId, HospitalUpdateRequest request) {
		Hospital hospital = findHospital(hospitalId);
		if (!hospital.isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원을 관리할 권한이 없습니다.");
		}

		hospital.update(
				request.name(), request.address(), request.latitude(), request.longitude(), request.openingHours(),
				request.specialty(), request.is24Hours(), request.hasParking(), request.avgTreatmentPrice());
		return toResponseWithRating(hospital);
	}

	private static final double EARTH_RADIUS_KM = 6371;

	public List<HospitalResponse> search(
			String keyword, Double minRating, HospitalSortType sort, Double lat, Double lng, Double radiusKm,
			Boolean is24Hours, Boolean hasParking) {
		List<HospitalResponse> results = hospitalRepository.search(keyword, minRating, sort, is24Hours, hasParking).stream()
				.map(result -> HospitalResponse.of(result.hospital(), result.averageRating(), result.reviewCount()))
				.toList();

		if (lat == null || lng == null || radiusKm == null) {
			return results;
		}

		return results.stream()
				.filter(r -> r.latitude() != null && r.longitude() != null)
				.map(r -> r.withDistance(distanceKm(lat, lng, r.latitude(), r.longitude())))
				.filter(r -> r.distanceKm() <= radiusKm)
				.sorted(Comparator.comparingDouble(HospitalResponse::distanceKm))
				.toList();
	}

	private double distanceKm(double lat1, double lng1, double lat2, double lng2) {
		double dLat = Math.toRadians(lat2 - lat1);
		double dLng = Math.toRadians(lng2 - lng1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
				+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
				* Math.sin(dLng / 2) * Math.sin(dLng / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return EARTH_RADIUS_KM * c;
	}

	public HospitalResponse get(Long hospitalId) {
		return toResponseWithRating(findHospital(hospitalId));
	}

	private HospitalResponse toResponseWithRating(Hospital hospital) {
		Double averageRating = reviewRepository.findAverageRatingByHospitalId(hospital.getId());
		long reviewCount = reviewRepository.countByHospitalIdAndHiddenFalse(hospital.getId());
		return HospitalResponse.of(hospital, averageRating, reviewCount);
	}

	public Hospital findHospital(Long hospitalId) {
		return hospitalRepository.findById(hospitalId)
				.orElseThrow(() -> new NotFoundException("병원을 찾을 수 없습니다."));
	}
}
