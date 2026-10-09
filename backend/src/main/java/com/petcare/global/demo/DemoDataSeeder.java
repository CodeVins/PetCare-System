package com.petcare.global.demo;

import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.hospital.OpeningHour;
import com.petcare.domain.hospital.Review;
import com.petcare.domain.hospital.ReviewRepository;
import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.pet.PetSpecies;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.ReservationType;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.file.FileStorageService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 운영 데모 데이터 — `DEMO_SEED=true`(app.demo.enabled)일 때만 빈이 생김.
 * - 앱 시작 시 데모 병원이 하나도 없으면 가상 병원 15곳 + 커버 이미지 + 리뷰를 한 번 만듦(이미 있으면 건드리지 않음)
 * - 시작 시와 매일 00:10에 앞으로 {@value #SLOT_DAYS}일치 예약 슬롯을 채움(이미 있는 시간은 건너뜀) — 예약 데모가 항상 동작하게
 * 서비스 계층을 거치지 않고 레포지토리로 직접 넣음 — 찜 알림 같은 부수 효과 없이 데이터만.
 * 리뷰 작성자는 로그인 불가 계정(정지 + 랜덤 비밀번호), 리뷰 자격 규칙에 맞게 지난 확정 예약도 같이 만듦.
 */
@Component
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoDataSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

	static final int SLOT_DAYS = 7;
	static final int SLOT_MINUTES = 30;
	private static final int REVIEWER_COUNT = 4;

	private final HospitalRepository hospitalRepository;
	private final SlotRepository slotRepository;
	private final UserRepository userRepository;
	private final PetRepository petRepository;
	private final ReservationRepository reservationRepository;
	private final ReviewRepository reviewRepository;
	private final FileStorageService fileStorageService;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		seedIfAbsent();
		int created = topUpSlots();
		log.info("[데모 데이터] 슬롯 {}개 추가", created);
	}

	@Scheduled(cron = "0 10 0 * * *")
	@Transactional
	public void dailyTopUp() {
		log.info("[데모 데이터] 슬롯 {}개 추가", topUpSlots());
	}

	@Transactional
	public void seedIfAbsent() {
		if (!hospitalRepository.findAllByNameIn(DemoHospitals.names()).isEmpty()) {
			return;
		}
		List<Pet> reviewerPets = reviewerPets();
		List<DemoHospitals.Def> defs = DemoHospitals.ALL;
		for (int i = 0; i < defs.size(); i++) {
			DemoHospitals.Def def = defs.get(i);
			boolean always = def.hours() == DemoHospitals.Hours.TWENTY_FOUR;
			Hospital hospital = Hospital.builder()
					.name(def.name())
					.address(def.district() + " 일대 (가상 주소)")
					.latitude(def.lat())
					.longitude(def.lng())
					.openingHours(DemoHospitals.openingNote(def.hours()))
					.specialty(def.specialty())
					.is24Hours(always)
					.hasParking(def.parking())
					.avgTreatmentPrice(def.avgPrice())
					.build();
			hospital.updateProfile(DemoHospitals.phone(i), DemoHospitals.description(def), def.animals(), def.amenities());
			hospital.replaceWeeklyHours(DemoHospitals.ranges(def.hours()).stream()
					.map(range -> new OpeningHour(range.day(), range.open(), range.close()))
					.toList());
			hospital.changeImageUrl(fileStorageService.storeHospitalImage(DemoImageGenerator.render(i)));
			hospitalRepository.save(hospital);
			addReviews(hospital, i, reviewerPets);
		}
		log.info("[데모 데이터] 가상 병원 {}곳 생성", defs.size());
	}

	// 병원마다 리뷰 0~4개(인덱스로 고정) — 각 리뷰마다 지난 확정 예약을 먼저 만들어 "방문자만 리뷰" 규칙과 맞춤
	private void addReviews(Hospital hospital, int index, List<Pet> reviewerPets) {
		int count = index % (REVIEWER_COUNT + 1);
		for (int r = 0; r < count; r++) {
			Pet pet = reviewerPets.get(r);
			LocalDateTime start = LocalDate.now().minusDays(3L + r * 5L + index % 3).atTime(10, 0);
			Slot slot = Slot.builder().hospital(hospital).startTime(start).endTime(start.plusMinutes(SLOT_MINUTES)).build();
			slot.reserve();
			slotRepository.save(slot);
			reservationRepository.save(Reservation.builder()
					.slot(slot)
					.pet(pet)
					.user(pet.getUser())
					.status(ReservationStatus.CONFIRMED)
					.type(ReservationType.CHECKUP)
					.build());
			reviewRepository.save(Review.builder()
					.hospital(hospital)
					.user(pet.getUser())
					.rating(3 + (index + r) % 3)
					.content(DemoHospitals.REVIEWS.get((index + r) % DemoHospitals.REVIEWS.size()))
					.build());
		}
	}

	// 리뷰 작성용 계정 — 랜덤 비밀번호 + 정지 상태라 아무도 로그인할 수 없음(공개 데모 계정 아님)
	private List<Pet> reviewerPets() {
		List<Pet> pets = new ArrayList<>();
		for (int i = 1; i <= REVIEWER_COUNT; i++) {
			String email = "demo-reviewer-" + i + "@petcare.invalid";
			User user = userRepository.findByEmail(email).orElseGet(() -> {
				User created = User.builder()
						.email(email)
						.password(passwordEncoder.encode(UUID.randomUUID().toString()))
						.role(Role.USER)
						.build();
				created.suspend();
				return userRepository.save(created);
			});
			pets.add(petRepository.save(Pet.builder()
					.user(user)
					.name("데모펫" + i)
					.species(i % 2 == 0 ? PetSpecies.CAT : PetSpecies.DOG)
					.build()));
		}
		return pets;
	}

	// 오늘부터 SLOT_DAYS일 동안 진료 시간 안에서 정시마다 30분 슬롯 — 지난 시간·이미 있는 슬롯과 겹치는 시간은 건너뜀
	@Transactional
	public int topUpSlots() {
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime from = LocalDate.now().atStartOfDay();
		LocalDateTime to = from.plusDays(SLOT_DAYS + 1L);
		int created = 0;
		for (Hospital hospital : hospitalRepository.findAllByNameIn(DemoHospitals.names())) {
			List<Slot> existing = slotRepository.findAllByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
					hospital.getId(), to, from);
			List<Slot> toSave = new ArrayList<>();
			for (LocalDate date = from.toLocalDate(); date.isBefore(to.toLocalDate()); date = date.plusDays(1)) {
				for (LocalDateTime start : candidateStarts(hospital, date)) {
					LocalDateTime end = start.plusMinutes(SLOT_MINUTES);
					boolean overlaps = existing.stream()
							.anyMatch(slot -> slot.getStartTime().isBefore(end) && start.isBefore(slot.getEndTime()));
					if (start.isAfter(now) && !overlaps) {
						toSave.add(Slot.builder().hospital(hospital).startTime(start).endTime(end).build());
					}
				}
			}
			slotRepository.saveAll(toSave);
			created += toSave.size();
		}
		return created;
	}

	private List<LocalDateTime> candidateStarts(Hospital hospital, LocalDate date) {
		List<LocalDateTime> starts = new ArrayList<>();
		if (Boolean.TRUE.equals(hospital.getIs24Hours())) {
			for (int hour = 9; hour <= 21; hour++) {
				starts.add(date.atTime(hour, 0));
			}
			return starts;
		}
		for (OpeningHour range : hospital.getWeeklyHours()) {
			if (range.getDayOfWeek() != date.getDayOfWeek()) {
				continue;
			}
			// 시작이 정시가 아니면(09:30) 다음 정시부터
			LocalTime time = range.getOpenTime().getMinute() == 0
					? range.getOpenTime() : range.getOpenTime().withMinute(0).plusHours(1);
			// 23시대 구간이면 plusHours가 자정을 넘어 00시로 돌아가므로, 시작 시각보다 작아지면 멈춤(무한 루프 방지)
			while (!time.isBefore(range.getOpenTime()) && !time.plusMinutes(SLOT_MINUTES).isAfter(range.getCloseTime())) {
				starts.add(date.atTime(time));
				time = time.plusHours(1);
			}
		}
		return starts;
	}
}
