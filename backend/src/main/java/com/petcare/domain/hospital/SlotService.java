package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.SlotBulkCreateRequest;
import com.petcare.domain.hospital.dto.SlotBulkCreateResponse;
import com.petcare.domain.hospital.dto.SlotCreateRequest;
import com.petcare.domain.hospital.dto.SlotResponse;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.user.User;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SlotService {

	private static final int MAX_BULK_DAYS = 31;
	private static final int MAX_BULK_SLOTS = 500;

	private final SlotRepository slotRepository;
	private final HospitalService hospitalService;
	private final FavoriteRepository favoriteRepository;
	private final NotificationService notificationService;
	private final ReservationRepository reservationRepository;

	@Transactional
	public SlotResponse create(User currentUser, Long hospitalId, SlotCreateRequest request) {
		if (!request.endTime().isAfter(request.startTime())) {
			throw new BadRequestException("종료 시간은 시작 시간보다 늦어야 합니다.");
		}

		Hospital hospital = getManagedHospital(currentUser, hospitalId);
		// 변경(2026-09-27): 같은 병원의 겹치는 슬롯 생성 차단 (이전: 중복 검사 없어서 같은 시간대 슬롯이 여러 개 생길 수 있었음)
		if (slotRepository.existsByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
				hospitalId, request.endTime(), request.startTime())) {
			throw new ConflictException("이미 같은 시간대에 슬롯이 있습니다.");
		}

		Slot slot = Slot.builder()
				.hospital(hospital)
				.startTime(request.startTime())
				.endTime(request.endTime())
				.build();
		SlotResponse response = SlotResponse.from(slotRepository.save(slot));

		notifyFavoriters(hospital);
		return response;
	}

	// 기간 × 요일 × 하루 시간대를 간격으로 잘라 슬롯을 만든다. 지난 시간·기존 슬롯과 겹치는 칸은 실패 대신 건너뜀
	// (일부만 겹쳐도 나머지는 등록되게 — 매주 반복 등록할 때 이미 만든 주가 섞여 있어도 되도록)
	@Transactional
	public SlotBulkCreateResponse createBulk(User currentUser, Long hospitalId, SlotBulkCreateRequest request) {
		if (request.endDate().isBefore(request.startDate())) {
			throw new BadRequestException("종료 날짜는 시작 날짜와 같거나 늦어야 합니다.");
		}
		if (ChronoUnit.DAYS.between(request.startDate(), request.endDate()) >= MAX_BULK_DAYS) {
			throw new BadRequestException("한 번에 최대 " + MAX_BULK_DAYS + "일까지 등록할 수 있습니다.");
		}
		if (!request.endTime().isAfter(request.startTime())) {
			throw new BadRequestException("하루 종료 시간은 시작 시간보다 늦어야 합니다.");
		}
		Hospital hospital = getManagedHospital(currentUser, hospitalId);

		// LocalTime이 아니라 LocalDateTime으로 순회 — LocalTime.plusMinutes는 자정을 넘으면 0시로 돌아가서 무한 루프 위험
		List<LocalDateTime[]> candidates = new ArrayList<>();
		for (LocalDate date = request.startDate(); !date.isAfter(request.endDate()); date = date.plusDays(1)) {
			if (!request.daysOfWeek().contains(date.getDayOfWeek())) {
				continue;
			}
			LocalDateTime dayEnd = date.atTime(request.endTime());
			for (LocalDateTime start = date.atTime(request.startTime());
					!start.plusMinutes(request.intervalMinutes()).isAfter(dayEnd);
					start = start.plusMinutes(request.intervalMinutes())) {
				candidates.add(new LocalDateTime[] {start, start.plusMinutes(request.intervalMinutes())});
			}
		}
		if (candidates.size() > MAX_BULK_SLOTS) {
			throw new BadRequestException("한 번에 최대 " + MAX_BULK_SLOTS + "개까지 등록할 수 있습니다. (요청: "
					+ candidates.size() + "개)");
		}

		List<Slot> existing = slotRepository.findAllByHospitalIdAndStartTimeLessThanAndEndTimeGreaterThan(
				hospitalId, request.endDate().plusDays(1).atStartOfDay(), request.startDate().atStartOfDay());
		LocalDateTime now = LocalDateTime.now();
		List<Slot> toSave = new ArrayList<>();
		for (LocalDateTime[] c : candidates) {
			boolean overlaps = existing.stream()
					.anyMatch(slot -> slot.getStartTime().isBefore(c[1]) && slot.getEndTime().isAfter(c[0]));
			if (c[0].isAfter(now) && !overlaps) {
				toSave.add(Slot.builder().hospital(hospital).startTime(c[0]).endTime(c[1]).build());
			}
		}
		slotRepository.saveAll(toSave);

		if (!toSave.isEmpty()) {
			notifyFavoriters(hospital); // 슬롯마다가 아니라 한 번만
		}
		return new SlotBulkCreateResponse(toSave.size(), candidates.size() - toSave.size());
	}

	// 예약 가능(AVAILABLE)하고 예약 이력이 전혀 없는 슬롯만 삭제 — 취소/거절된 예약도 slot_id로 이 슬롯을 참조하고 있어서
	// 지우면 FK 위반이고, 예약 이력은 통계/리뷰 자격과 얽혀 있어 남겨야 함 (Pet 삭제 정책과 같은 이유)
	@Transactional
	public void delete(User currentUser, Long hospitalId, Long slotId) {
		Hospital hospital = getManagedHospital(currentUser, hospitalId);
		Slot slot = findSlot(slotId);
		if (!slot.getHospital().getId().equals(hospital.getId())) {
			throw new NotFoundException("예약 가능 시간을 찾을 수 없습니다.");
		}
		if (!slot.isAvailable()) {
			throw new ConflictException("예약된 슬롯은 삭제할 수 없습니다.");
		}
		if (reservationRepository.existsBySlotId(slotId)) {
			throw new ConflictException("예약 이력이 있는 슬롯은 삭제할 수 없습니다.");
		}
		slotRepository.delete(slot);
	}

	private Hospital getManagedHospital(User currentUser, Long hospitalId) {
		Hospital hospital = hospitalService.findHospital(hospitalId);
		if (!hospital.isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원을 관리할 권한이 없습니다.");
		}
		return hospital;
	}

	private void notifyFavoriters(Hospital hospital) {
		String content = "찜한 병원 '" + hospital.getName() + "'에 새로운 예약 가능 시간이 열렸습니다.";
		for (Favorite favorite : favoriteRepository.findAllByHospitalId(hospital.getId())) {
			notificationService.notify(favorite.getUser().getId(), NotificationType.FAVORITE_HOSPITAL_NEW_SLOT, content);
		}
	}

	// 변경(2026-09-27): 지난 슬롯 제외 (이전: 지난 슬롯까지 전부 반환 — 정렬은 컨트롤러 기본값 startTime 오름차순)
	public PageResponse<SlotResponse> getSlots(Long hospitalId, SlotStatus status, Pageable pageable) {
		LocalDateTime now = LocalDateTime.now();
		Page<Slot> slots = status != null
				? slotRepository.findAllByHospitalIdAndStatusAndStartTimeAfter(hospitalId, status, now, pageable)
				: slotRepository.findAllByHospitalIdAndStartTimeAfter(hospitalId, now, pageable);

		return PageResponse.from(slots.map(SlotResponse::from));
	}

	Slot findSlot(Long slotId) {
		return slotRepository.findById(slotId)
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
	}
}
