package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalCreateRequest;
import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.domain.hospital.dto.HospitalUpdateRequest;
import com.petcare.domain.hospital.dto.OpeningHoursUpdateRequest;
import com.petcare.domain.user.User;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import com.petcare.global.file.FileStorageService;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

	// 병원 상세(평점 집계 포함) 캐시 — 병원 정보·리뷰가 바뀌는 곳마다 hospitalId로 무효화
	public static final String CACHE = "hospital";

	private final HospitalRepository hospitalRepository;
	private final ReviewRepository reviewRepository;
	private final FileStorageService fileStorageService;

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
	// 변경(2026-10-02): 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = CACHE, key = "#hospitalId")
	public HospitalResponse update(User currentUser, Long hospitalId, HospitalUpdateRequest request) {
		Hospital hospital = findManagedHospital(currentUser, hospitalId);

		hospital.update(
				request.name(), request.address(), request.latitude(), request.longitude(), request.openingHours(),
				request.specialty(), request.is24Hours(), request.hasParking(), request.avgTreatmentPrice());
		return toResponseWithRating(hospital);
	}

	private static final int MAX_HOURS_PER_DAY = 3;

	@Transactional
	@CacheEvict(cacheNames = CACHE, key = "#hospitalId")
	public HospitalResponse updateWeeklyHours(User currentUser, Long hospitalId, OpeningHoursUpdateRequest request) {
		Hospital hospital = findManagedHospital(currentUser, hospitalId);
		List<OpeningHour> hours = request.hours().stream()
				.map(hour -> new OpeningHour(hour.dayOfWeek(), hour.openTime(), hour.closeTime()))
				.toList();
		for (OpeningHour hour : hours) {
			if (!hour.getOpenTime().isBefore(hour.getCloseTime())) {
				throw new BadRequestException("종료 시간은 시작 시간보다 늦어야 합니다. 자정을 넘겨 운영하면 24시간 운영으로 설정해주세요.");
			}
		}
		for (DayOfWeek day : DayOfWeek.values()) {
			List<OpeningHour> sameDay = hours.stream().filter(hour -> hour.getDayOfWeek() == day).toList();
			if (sameDay.size() > MAX_HOURS_PER_DAY) {
				throw new BadRequestException("진료 시간은 요일당 " + MAX_HOURS_PER_DAY + "개까지 등록할 수 있습니다.");
			}
			for (int i = 0; i < sameDay.size(); i++) {
				for (int j = i + 1; j < sameDay.size(); j++) {
					if (sameDay.get(i).overlaps(sameDay.get(j))) {
						throw new BadRequestException("같은 요일의 진료 시간이 서로 겹칩니다.");
					}
				}
			}
		}
		hospital.replaceWeeklyHours(hours);
		return toResponseWithRating(hospital);
	}

	private static final double EARTH_RADIUS_KM = 6371;

	// 변경(2026-10-05): openNow(지금 진료 중만) 파라미터 추가 — 진료 시간이 요일별 구간 목록이라 DB 조건 대신 조회 후 자바로 거름
	// (병원 수가 수천 단위까지는 문제없음, 진료 시간 미등록 병원은 제외) (이전: 없음)
	public List<HospitalResponse> search(
			String keyword, Double minRating, HospitalSortType sort, Double lat, Double lng, Double radiusKm,
			Boolean is24Hours, Boolean hasParking, Boolean openNow) {
		boolean nearby = lat != null && lng != null && radiusKm != null;
		// 변경(2026-10-02): 거리 검색이면 사각형 범위로 DB에서 1차 필터 후 아래에서 정확한 원으로 재필터 (이전: 전체 병원 조회 후 메모리 필터)
		GeoBox box = nearby ? GeoBox.around(lat, lng, radiusKm) : null;
		LocalDateTime now = LocalDateTime.now();
		List<HospitalResponse> results = hospitalRepository.search(keyword, minRating, sort, is24Hours, hasParking, box).stream()
				.filter(result -> !Boolean.TRUE.equals(openNow) || Boolean.TRUE.equals(result.hospital().isOpenAt(now)))
				.map(result -> HospitalResponse.of(result.hospital(), result.averageRating(), result.reviewCount()))
				.toList();

		if (!nearby) {
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

	// 병원 관리 콘솔의 "관리할 병원" — 본인이 소유자로 지정된 병원만
	public List<HospitalResponse> getOwned(Long userId) {
		return hospitalRepository.findAllByOwnerIdOrderByNameAsc(userId).stream()
				.map(this::toResponseWithRating)
				.toList();
	}

	// 변경(2026-10-02): Redis 캐시(TTL 10분) — 병원 상세는 조회마다 평점 집계 쿼리 2번 (이전: 매번 DB 조회)
	@Cacheable(cacheNames = CACHE, key = "#hospitalId")
	public HospitalResponse get(Long hospitalId) {
		return toResponseWithRating(findHospital(hospitalId));
	}

	// 메서드 파라미터에 hospitalId가 없는 곳(리뷰 숨김 등)에서 캐시를 지울 때 사용
	@CacheEvict(cacheNames = CACHE, key = "#hospitalId")
	public void evictCache(Long hospitalId) {
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

	@Transactional
	// 변경(2026-10-02): 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = CACHE, key = "#hospitalId")
	public HospitalResponse uploadImage(User currentUser, Long hospitalId, MultipartFile file) {
		Hospital hospital = findManagedHospital(currentUser, hospitalId);
		String previousImageUrl = hospital.getImageUrl();

		String imageUrl = fileStorageService.storeHospitalImage(file);
		hospital.changeImageUrl(imageUrl);
		fileStorageService.deleteHospitalImage(previousImageUrl);

		return toResponseWithRating(hospital);
	}

	@Transactional
	// 변경(2026-10-02): 병원 상세 캐시 무효화 (이전: 캐시 없음)
	@CacheEvict(cacheNames = CACHE, key = "#hospitalId")
	public void deleteImage(User currentUser, Long hospitalId) {
		Hospital hospital = findManagedHospital(currentUser, hospitalId);
		fileStorageService.deleteHospitalImage(hospital.getImageUrl());
		hospital.changeImageUrl(null);
	}

	private Hospital findManagedHospital(User currentUser, Long hospitalId) {
		Hospital hospital = findHospital(hospitalId);
		if (!hospital.isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원을 관리할 권한이 없습니다.");
		}
		return hospital;
	}
}
