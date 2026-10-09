package com.petcare.global.demo;

import static com.petcare.domain.hospital.HospitalAmenity.BOARDING;
import static com.petcare.domain.hospital.HospitalAmenity.CAT_FRIENDLY;
import static com.petcare.domain.hospital.HospitalAmenity.EMERGENCY;
import static com.petcare.domain.hospital.HospitalAmenity.GROOMING;
import static com.petcare.domain.hospital.HospitalAmenity.HEALTH_SCREENING;
import static com.petcare.domain.hospital.HospitalAmenity.REHABILITATION;
import static com.petcare.domain.hospital.HospitalAnimal.CAT;
import static com.petcare.domain.hospital.HospitalAnimal.DOG;
import static com.petcare.domain.hospital.HospitalAnimal.EXOTIC;

import com.petcare.domain.hospital.HospitalAmenity;
import com.petcare.domain.hospital.HospitalAnimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * 데모용 가상 병원 정의. 이름은 일부러 동화 같은 이름, 주소는 동 단위 "일대"까지만, 전화번호는 실제로 걸리지 않는
 * 02-0000-xxxx 대역 — 실제 병원·사업자와 겹치거나 사칭으로 보이지 않게. 좌표는 각 동네의 대략적인 위치(거리 검색용).
 */
final class DemoHospitals {

	// 진료 시간 패턴 — "지금 진료 중"·야간 진료 배지가 다양하게 보이게 섞음
	enum Hours { WEEKDAY_LUNCH, LONG_DAY, NIGHT, TWENTY_FOUR, SHORT_SAT }

	record Def(
			String name, String district, double lat, double lng, Hours hours, String specialty,
			Set<HospitalAnimal> animals, Set<HospitalAmenity> amenities, boolean parking, int avgPrice, String intro) {
	}

	static final List<Def> ALL = List.of(
			new Def("말랑발바닥 동물병원", "서울 마포구 망원동", 37.556, 126.906, Hours.WEEKDAY_LUNCH, "내과, 피부과",
					Set.of(DOG, CAT), Set.of(GROOMING), false, 45000,
					"동네 산책길에 들르기 좋은 작은 병원이에요. 피부·귀 질환 진료를 많이 봅니다."),
			new Def("꼬리별 24시 동물의료센터", "서울 강남구 역삼동", 37.500, 127.036, Hours.TWENTY_FOUR, "내과, 외과, 영상의학과",
					Set.of(DOG, CAT, EXOTIC), Set.of(EMERGENCY, HEALTH_SCREENING), true, 90000,
					"밤낮없이 응급 진료가 가능한 24시간 의료센터입니다. CT·초음파 장비를 갖추고 있어요."),
			new Def("몽글몽글 동물병원", "서울 송파구 잠실동", 37.511, 127.098, Hours.LONG_DAY, "내과, 치과",
					Set.of(DOG, CAT), Set.of(GROOMING, HEALTH_SCREENING), true, 55000,
					"스케일링과 치과 진료에 집중하는 병원이에요. 정기 건강검진 패키지를 운영합니다."),
			new Def("콩닥콩닥 고양이 클리닉", "서울 종로구 혜화동", 37.582, 127.001, Hours.WEEKDAY_LUNCH, "고양이 내과",
					Set.of(CAT), Set.of(CAT_FRIENDLY, HEALTH_SCREENING), false, 60000,
					"고양이만 진료하는 클리닉이에요. 강아지 소리가 없는 조용한 진료실에서 기다릴 수 있어요."),
			new Def("새싹 반려동물 병원", "서울 성동구 성수동", 37.544, 127.056, Hours.NIGHT, "내과, 외과",
					Set.of(DOG, CAT), Set.of(BOARDING, GROOMING), true, 50000,
					"평일 밤 10시까지 진료해서 퇴근 후에도 들를 수 있어요. 호텔(위탁)도 함께 운영합니다."),
			new Def("한강뷰 동물병원", "서울 영등포구 여의도동", 37.521, 126.924, Hours.LONG_DAY, "내과, 정형외과",
					Set.of(DOG), Set.of(REHABILITATION), true, 70000,
					"슬개골·관절 수술 후 재활 치료까지 한곳에서 받을 수 있는 병원입니다."),
			new Def("포근한 앞발 동물병원", "서울 관악구 봉천동", 37.482, 126.941, Hours.SHORT_SAT, "내과",
					Set.of(DOG, CAT), Set.of(), false, 35000,
					"부담 없는 진료비로 예방접종과 기본 진료를 꼼꼼하게 봐 드려요."),
			new Def("숲속쉼터 동물병원", "서울 노원구 상계동", 37.654, 127.061, Hours.WEEKDAY_LUNCH, "내과, 특수동물",
					Set.of(DOG, CAT, EXOTIC), Set.of(HEALTH_SCREENING), true, 40000,
					"토끼·햄스터·앵무새 같은 특수동물도 진료합니다. 특수동물 전담 수의사가 있어요."),
			new Def("구름다리 동물의료센터", "서울 강서구 마곡동", 37.560, 126.825, Hours.TWENTY_FOUR, "내과, 외과, 응급의학과",
					Set.of(DOG, CAT), Set.of(EMERGENCY, REHABILITATION), true, 85000,
					"서남권 24시간 응급 진료 병원이에요. 야간·주말 응급 수술이 가능합니다."),
			new Def("반짝반짝 동물병원", "서울 용산구 이태원동", 37.534, 126.994, Hours.NIGHT, "내과, 피부과, 안과",
					Set.of(DOG, CAT), Set.of(GROOMING), false, 60000,
					"영어 진료가 가능한 병원이에요. 피부·안과 진료를 함께 봅니다."),
			new Def("솜사탕 고양이 병원", "서울 서초구 반포동", 37.505, 127.004, Hours.LONG_DAY, "고양이 내과, 고양이 치과",
					Set.of(CAT), Set.of(CAT_FRIENDLY, BOARDING), true, 75000,
					"고양이 전용 병원이에요. 신장·갑상선 정기 검진과 고양이 호텔을 운영합니다."),
			new Def("바람개비 동물병원", "서울 광진구 화양동", 37.540, 127.069, Hours.SHORT_SAT, "내과, 외과",
					Set.of(DOG, CAT), Set.of(GROOMING, BOARDING), false, 40000,
					"미용과 호텔을 함께 운영해서 진료 받은 김에 목욕까지 맡길 수 있어요."),
			new Def("햇살마루 동물병원", "서울 동작구 사당동", 37.476, 126.981, Hours.WEEKDAY_LUNCH, "내과, 영상의학과",
					Set.of(DOG, CAT), Set.of(HEALTH_SCREENING), true, 55000,
					"초음파·엑스레이 검진을 당일 결과로 설명해 드리는 병원이에요."),
			new Def("도토리숲 동물병원", "서울 은평구 불광동", 37.619, 126.921, Hours.NIGHT, "내과, 특수동물",
					Set.of(DOG, CAT, EXOTIC), Set.of(), false, 38000,
					"고슴도치·거북이 등 특수동물 진료도 가능한 동네 병원입니다."),
			new Def("별빛정원 동물병원", "서울 강동구 천호동", 37.538, 127.124, Hours.LONG_DAY, "내과, 외과, 재활의학과",
					Set.of(DOG), Set.of(REHABILITATION, HEALTH_SCREENING), true, 65000,
					"노령견 진료와 수중 재활 치료를 전문으로 해요.")
	);

	static List<String> names() {
		return ALL.stream().map(Def::name).toList();
	}

	static String phone(int index) {
		return String.format("02-0000-%04d", 1001 + index);
	}

	static String description(Def def) {
		return def.intro() + "\n※ 포트폴리오 데모용 가상 병원입니다.";
	}

	static String openingNote(Hours hours) {
		return switch (hours) {
			case WEEKDAY_LUNCH -> "점심시간 13:00~14:00, 일요일·공휴일 휴무";
			case LONG_DAY -> "점심시간 없이 진료, 공휴일 휴무";
			case NIGHT -> "평일 22:00까지 야간 진료, 일요일 휴무";
			case TWENTY_FOUR -> "연중무휴 24시간 진료";
			case SHORT_SAT -> "토요일 오전 진료, 일요일·공휴일 휴무";
		};
	}

	record Range(DayOfWeek day, LocalTime open, LocalTime close) {
	}

	// 24시간 병원은 is24Hours로 판단하므로 구간 없음
	static List<Range> ranges(Hours hours) {
		List<Range> result = new ArrayList<>();
		for (DayOfWeek day : DayOfWeek.values()) {
			boolean weekday = day.getValue() <= 5;
			switch (hours) {
				case WEEKDAY_LUNCH -> {
					if (weekday || day == DayOfWeek.SATURDAY) {
						result.add(new Range(day, LocalTime.of(9, 0), LocalTime.of(13, 0)));
						result.add(new Range(day, LocalTime.of(14, 0), weekday ? LocalTime.of(19, 0) : LocalTime.of(17, 0)));
					}
				}
				case LONG_DAY -> result.add(new Range(day, LocalTime.of(10, 0), weekday ? LocalTime.of(20, 0) : LocalTime.of(17, 0)));
				case NIGHT -> {
					if (day != DayOfWeek.SUNDAY) {
						result.add(new Range(day, LocalTime.of(weekday ? 12 : 10, 0), weekday ? LocalTime.of(22, 0) : LocalTime.of(18, 0)));
					}
				}
				case SHORT_SAT -> {
					if (weekday) {
						result.add(new Range(day, LocalTime.of(9, 30), LocalTime.of(18, 30)));
					} else if (day == DayOfWeek.SATURDAY) {
						result.add(new Range(day, LocalTime.of(9, 30), LocalTime.of(13, 0)));
					}
				}
				case TWENTY_FOUR -> {
				}
			}
		}
		return result;
	}

	// 데모 리뷰 문구 — 실제 후기처럼 보이지 않게 짧고 일반적인 문장만
	static final List<String> REVIEWS = List.of(
			"설명을 차근차근 해 주셔서 마음이 놓였어요.",
			"대기 시간이 짧고 진료실이 깨끗했어요.",
			"아이가 겁이 많은데 천천히 진정시켜 주셨어요.",
			"예약 시간에 맞춰 바로 진료 받았어요.",
			"검사 결과를 사진으로 보여 주셔서 이해하기 쉬웠어요.",
			"진료비 안내를 미리 해 주셔서 좋았어요.",
			"다음 접종 일정까지 챙겨 주셨어요.",
			"주차가 편하고 직원분들이 친절해요."
	);

	private DemoHospitals() {
	}
}
