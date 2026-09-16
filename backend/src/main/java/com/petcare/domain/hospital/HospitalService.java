package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalCreateRequest;
import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.global.exception.NotFoundException;
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
				.build();

		return HospitalResponse.from(hospitalRepository.save(hospital));
	}

	public List<HospitalResponse> search(String keyword, Double minRating, HospitalSortType sort) {
		return hospitalRepository.search(keyword, minRating, sort).stream()
				.map(result -> HospitalResponse.of(result.hospital(), result.averageRating(), result.reviewCount()))
				.toList();
	}

	public HospitalResponse get(Long hospitalId) {
		return toResponseWithRating(findHospital(hospitalId));
	}

	private HospitalResponse toResponseWithRating(Hospital hospital) {
		Double averageRating = reviewRepository.findAverageRatingByHospitalId(hospital.getId());
		long reviewCount = reviewRepository.countByHospitalId(hospital.getId());
		return HospitalResponse.of(hospital, averageRating, reviewCount);
	}

	Hospital findHospital(Long hospitalId) {
		return hospitalRepository.findById(hospitalId)
				.orElseThrow(() -> new NotFoundException("병원을 찾을 수 없습니다."));
	}
}
