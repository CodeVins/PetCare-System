package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalAmenity;
import com.petcare.domain.hospital.HospitalAnimal;
import com.petcare.domain.hospital.OpeningHour;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

// 변경(2026-10-05): weeklyHours(요일별 진료 시간, 월→일·시간순) 추가 — "지금 진료 중" 판단은 화면이 현재 시각으로 함
// (이 응답은 병원 상세 캐시(10분)에 들어가서 서버가 계산한 진료 중 여부를 넣으면 최대 10분 틀릴 수 있음) (이전: 자유 텍스트 openingHours만)
// 변경(2026-10-09): phone·description·animals·amenities 추가(enum은 선언 순서로 정렬) (이전: 없음)
public record HospitalResponse(
		Long id, String name, String address, Double latitude, Double longitude, String openingHours,
		String specialty, Boolean is24Hours, Boolean hasParking, Integer avgTreatmentPrice, String imageUrl,
		Double averageRating, long reviewCount, Double distanceKm, List<WeeklyHour> weeklyHours, String phone,
		String description, List<HospitalAnimal> animals, List<HospitalAmenity> amenities) {

	public record WeeklyHour(DayOfWeek dayOfWeek, LocalTime openTime, LocalTime closeTime) {
	}

	public static HospitalResponse of(Hospital hospital, Double averageRating, long reviewCount) {
		return new HospitalResponse(
				hospital.getId(), hospital.getName(), hospital.getAddress(), hospital.getLatitude(),
				hospital.getLongitude(), hospital.getOpeningHours(), hospital.getSpecialty(), hospital.getIs24Hours(),
				hospital.getHasParking(), hospital.getAvgTreatmentPrice(), hospital.getImageUrl(), averageRating,
				reviewCount, null, weeklyHoursOf(hospital), hospital.getPhone(), hospital.getDescription(),
				hospital.getAnimals().stream().sorted().toList(), hospital.getAmenities().stream().sorted().toList());
	}

	public static HospitalResponse from(Hospital hospital) {
		return of(hospital, null, 0);
	}

	public HospitalResponse withDistance(Double distanceKm) {
		return new HospitalResponse(
				id, name, address, latitude, longitude, openingHours, specialty, is24Hours, hasParking,
				avgTreatmentPrice, imageUrl, averageRating, reviewCount, distanceKm, weeklyHours, phone, description, animals,
				amenities);
	}

	// DB에는 요일이 문자열이라 정렬을 SQL에 맡기면 알파벳순이 됨 — 여기서 요일(월=1)·시작 시각순으로
	private static List<WeeklyHour> weeklyHoursOf(Hospital hospital) {
		return hospital.getWeeklyHours().stream()
				.sorted(Comparator.comparing(OpeningHour::getDayOfWeek).thenComparing(OpeningHour::getOpenTime))
				.map(hour -> new WeeklyHour(hour.getDayOfWeek(), hour.getOpenTime(), hour.getCloseTime()))
				.toList();
	}
}
