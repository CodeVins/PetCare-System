package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordRepository;
import com.petcare.domain.pet.HealthRecordType;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetGuardianRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.dto.ReservationCreateRequest;
import com.petcare.domain.reservation.dto.ReservationResponse;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

	private static final int HEALTH_CHECK_ATTACH_DAYS = 14;

	private final ReservationRepository reservationRepository;
	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;
	private final SlotRepository slotRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;
	private final WaitlistService waitlistService;
	private final HealthRecordRepository healthRecordRepository;

	@Transactional
	public ReservationResponse create(Long userId, ReservationCreateRequest request) {
		Pet pet = petRepository.findById(request.petId())
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId) && !petGuardianRepository.existsByPetIdAndUserId(pet.getId(), userId)) {
			throw new ForbiddenException("본인 또는 공동보호자로 등록된 반려동물만 예약할 수 있습니다.");
		}

		Slot slot = slotRepository.findById(request.slotId())
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
		// 변경(2026-09-27): 이미 시작된 슬롯 예약 차단 (이전: 상태만 보고 AVAILABLE이면 지난 시간도 예약됨)
		if (slot.hasStarted()) {
			throw new ConflictException("이미 지난 시간은 예약할 수 없습니다.");
		}
		if (!slot.isAvailable()) {
			throw new ConflictException("이미 예약된 시간입니다.");
		}
		// 변경(2026-10-05): 자가 문진 첨부·메모 — 슬롯을 잡기 전에 검증해서 잘못된 첨부면 슬롯이 묶이지 않게
		// (이전: 첨부 없음)
		HealthRecord healthCheck = request.healthCheckRecordId() == null ? null : findAttachableHealthCheck(pet, request);
		slot.reserve();
		// 변경(2026-10-05): 슬롯이 예약되면 대기자 차례 제안 종료 (이전: 알림 즉시 대기 항목을 지워서 정리할 게 없었음)
		waitlistService.closeOffers(slot);

		User user = userRepository.getReferenceById(userId);
		Reservation reservation = Reservation.builder()
				.slot(slot)
				.pet(pet)
				.user(user)
				.status(ReservationStatus.PENDING)
				.type(request.type())
				.memo(request.memo() == null || request.memo().isBlank() ? null : request.memo().trim())
				.healthCheckSummary(healthCheck == null ? null : healthCheck.getContent())
				.healthCheckDate(healthCheck == null ? null : healthCheck.getRecordedAt())
				.build();

		ReservationResponse response = ReservationResponse.from(reservationRepository.save(reservation));
		notificationService.notify(userId, NotificationType.RESERVATION_REQUESTED, "예약 요청이 접수되었습니다. 병원 확인을 기다려주세요.");
		// 변경(2026-09-27): 병원 소유자에게도 알림 — 확정/거절할 사람이 대시보드를 열어봐야만 새 예약을 알 수 있었음
		// (이전: 요청자 본인에게만 알림)
		User owner = slot.getHospital().getOwner();
		if (owner != null) {
			notificationService.notify(owner.getId(), NotificationType.RESERVATION_REQUESTED,
					"새 예약 요청이 들어왔습니다. 확정 또는 거절해주세요.");
		}
		return response;
	}

	// 같은 반려동물의 최근 자가 문진 기록만 첨부 가능 — 오래된 문진은 지금 증상과 무관할 수 있어서 기간 제한
	private HealthRecord findAttachableHealthCheck(Pet pet, ReservationCreateRequest request) {
		HealthRecord record = healthRecordRepository.findById(request.healthCheckRecordId())
				.filter(r -> r.getPet().getId().equals(pet.getId()) && r.getType() == HealthRecordType.HEALTH_CHECK)
				.orElseThrow(() -> new BadRequestException("이 반려동물의 자가 문진 기록만 첨부할 수 있습니다."));
		if (record.getRecordedAt().isBefore(LocalDate.now().minusDays(HEALTH_CHECK_ATTACH_DAYS))) {
			throw new BadRequestException("최근 " + HEALTH_CHECK_ATTACH_DAYS + "일 이내의 자가 문진만 첨부할 수 있습니다.");
		}
		return record;
	}

	// 변경(2026-10-09): 반려동물·보기(다가오는/지난/취소) 필터 + 지운 예약 제외, 정렬은 슬롯 시간 기준으로 고정
	// (이전: 내 예약 전체를 요청 정렬대로 — 화면이 불러온 페이지 안에서만 걸러서 다음 페이지에 있는 건 안 보였음)
	public PageResponse<ReservationResponse> getMyReservations(
			Long userId, Long petId, ReservationView view, Pageable pageable) {
		Sort.Direction direction = view == ReservationView.UPCOMING ? Sort.Direction.ASC : Sort.Direction.DESC;
		Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
				Sort.by(direction, "slot.startTime").and(Sort.by(direction, "id")));
		LocalDateTime now = LocalDateTime.now();
		return PageResponse.from(reservationRepository.findMine(
				userId, petId, view.statuses(), after(view, now), before(view, now), sorted).map(ReservationResponse::from));
	}

	// 보기별 개수(탭 배지용) — 같은 반려동물 필터 기준
	public Map<ReservationView, Long> countMyReservations(Long userId, Long petId) {
		LocalDateTime now = LocalDateTime.now();
		Map<ReservationView, Long> counts = new EnumMap<>(ReservationView.class);
		for (ReservationView view : ReservationView.values()) {
			counts.put(view, reservationRepository.countMine(
					userId, petId, view.statuses(), after(view, now), before(view, now)));
		}
		return counts;
	}

	// 슬롯 시작 시간 구간 (after, before] — DB에 넣을 수 있는 범위 안의 양 끝값으로 "제한 없음"을 표현
	private static final LocalDateTime EARLIEST = LocalDateTime.of(2000, 1, 1, 0, 0);
	private static final LocalDateTime LATEST = LocalDateTime.of(9999, 12, 31, 0, 0);

	private static LocalDateTime after(ReservationView view, LocalDateTime now) {
		return view.timing() == ReservationView.Timing.FUTURE ? now : EARLIEST;
	}

	private static LocalDateTime before(ReservationView view, LocalDateTime now) {
		return view.timing() == ReservationView.Timing.STARTED ? now : LATEST;
	}

	// 내 목록에서 지우기 — 실제 삭제가 아니라 숨김(병원 기록·통계·리뷰 자격은 그대로)
	@Transactional
	public void hide(Long userId, Long reservationId) {
		Reservation reservation = getOwnedReservation(userId, reservationId);
		if (!reservation.isHideable()) {
			throw new ConflictException("진행 중인 예약은 삭제할 수 없습니다. 먼저 예약을 취소해 주세요.");
		}
		reservation.hideFromUser();
	}

	// 취소·거절된 예약 한 번에 지우기 — 지운 개수 반환
	@Transactional
	public int hideAllCancelled(Long userId) {
		return reservationRepository.hideAllByUserIdAndStatusIn(userId, ReservationView.CANCELLED.statuses());
	}

	public ReservationResponse get(Long userId, Long reservationId) {
		return ReservationResponse.from(getOwnedReservation(userId, reservationId));
	}

	@Transactional
	public void cancel(Long userId, Long reservationId) {
		Reservation reservation = getOwnedReservation(userId, reservationId);
		if (!isCancellable(reservation.getStatus())) {
			throw new ConflictException("취소할 수 없는 예약 상태입니다.");
		}
		// 변경(2026-09-27): 지난 예약 취소 차단 (이전: 지난 예약도 취소돼서 지난 슬롯이 다시 열리고 대기자에게 "자리 났어요" 알림까지 감)
		if (reservation.getSlot().hasStarted()) {
			throw new ConflictException("이미 지난 예약은 취소할 수 없습니다.");
		}
		reservation.cancel();
		reservation.getSlot().release();
		notificationService.notify(userId, NotificationType.RESERVATION_CANCELLED, "예약이 취소되었습니다.");
		waitlistService.notifyNextInLine(reservation.getSlot());
	}

	// 취소 후 재예약 대신 한 트랜잭션에서 슬롯을 맞바꿈 — 그 사이에 다른 사람이 원래 자리를 가져가는 일이 없음.
	// 새 슬롯을 동시에 잡으려는 요청끼리는 Slot @Version 낙관적 락으로 하나만 성공(나머지 409)
	@Transactional
	public ReservationResponse reschedule(Long userId, Long reservationId, Long newSlotId) {
		Reservation reservation = getOwnedReservation(userId, reservationId);
		if (!isCancellable(reservation.getStatus())) {
			throw new ConflictException("변경할 수 없는 예약 상태입니다.");
		}
		Slot oldSlot = reservation.getSlot();
		if (oldSlot.hasStarted()) {
			throw new ConflictException("이미 지난 예약은 변경할 수 없습니다.");
		}
		Slot newSlot = slotRepository.findById(newSlotId)
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
		if (newSlot.getId().equals(oldSlot.getId())) {
			throw new BadRequestException("지금과 다른 시간을 선택해주세요.");
		}
		if (!newSlot.getHospital().getId().equals(oldSlot.getHospital().getId())) {
			throw new BadRequestException("같은 병원의 시간으로만 변경할 수 있습니다. 다른 병원은 취소 후 새로 예약해주세요.");
		}
		if (newSlot.hasStarted()) {
			throw new ConflictException("이미 지난 시간으로는 변경할 수 없습니다.");
		}
		if (!newSlot.isAvailable()) {
			throw new ConflictException("이미 예약된 시간입니다.");
		}

		newSlot.reserve();
		// 변경(2026-10-05): 새 슬롯의 대기자 차례 제안 종료 — 신규 예약과 같은 처리 (이전: 없음)
		waitlistService.closeOffers(newSlot);
		oldSlot.release();
		reservation.reschedule(newSlot);

		User owner = newSlot.getHospital().getOwner();
		if (owner != null) {
			notificationService.notify(owner.getId(), NotificationType.RESERVATION_REQUESTED,
					"예약 시간 변경 요청이 들어왔습니다. 확정 또는 거절해주세요.");
		}
		waitlistService.notifyNextInLine(oldSlot);
		return ReservationResponse.from(reservation);
	}

	public PageResponse<ReservationResponse> getAllForAdmin(User currentUser, ReservationStatus status, Pageable pageable) {
		Page<Reservation> reservations;
		if (currentUser.getRole() == Role.ADMIN) {
			reservations = status != null
					? reservationRepository.findAllByStatus(status, pageable)
					: reservationRepository.findAll(pageable);
		} else {
			reservations = status != null
					? reservationRepository.findAllBySlot_Hospital_OwnerIdAndStatus(currentUser.getId(), status, pageable)
					: reservationRepository.findAllBySlot_Hospital_OwnerId(currentUser.getId(), pageable);
		}
		return PageResponse.from(reservations.map(ReservationResponse::from));
	}

	@Transactional
	public void confirm(User currentUser, Long reservationId) {
		Reservation reservation = getPendingReservation(reservationId);
		checkManagePermission(currentUser, reservation);
		reservation.confirm();
		notificationService.notify(reservation.getUser().getId(), NotificationType.RESERVATION_CONFIRMED, "예약이 확정되었습니다.");
	}

	@Transactional
	public void reject(User currentUser, Long reservationId) {
		Reservation reservation = getPendingReservation(reservationId);
		checkManagePermission(currentUser, reservation);
		reservation.reject();
		reservation.getSlot().release();
		notificationService.notify(reservation.getUser().getId(), NotificationType.RESERVATION_REJECTED, "예약 요청이 거절되었습니다.");
		waitlistService.notifyNextInLine(reservation.getSlot());
	}

	@Transactional
	public void noShow(User currentUser, Long reservationId) {
		Reservation reservation = reservationRepository.findById(reservationId)
				.orElseThrow(() -> new NotFoundException("예약을 찾을 수 없습니다."));
		checkManagePermission(currentUser, reservation);
		if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
			throw new ConflictException("확정된 예약만 노쇼 처리할 수 있습니다.");
		}
		// 변경(2026-09-27): 예약 시작 전 노쇼 처리 차단 (이전: 상태만 보고 아직 오지도 않은 미래 예약을 노쇼로 만들 수 있었음)
		if (!reservation.getSlot().hasStarted()) {
			throw new ConflictException("예약 시간이 지난 뒤에만 노쇼 처리할 수 있습니다.");
		}
		reservation.markNoShow();
		notificationService.notify(reservation.getUser().getId(), NotificationType.RESERVATION_NO_SHOW, "예약이 노쇼로 처리되었습니다.");
	}

	private void checkManagePermission(User currentUser, Reservation reservation) {
		if (!reservation.getSlot().getHospital().isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원의 예약을 관리할 권한이 없습니다.");
		}
	}

	private Reservation getPendingReservation(Long reservationId) {
		Reservation reservation = reservationRepository.findById(reservationId)
				.orElseThrow(() -> new NotFoundException("예약을 찾을 수 없습니다."));
		if (reservation.getStatus() != ReservationStatus.PENDING) {
			throw new ConflictException("대기 중인 예약만 확정/거절할 수 있습니다.");
		}
		return reservation;
	}

	private boolean isCancellable(ReservationStatus status) {
		return status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
	}

	private Reservation getOwnedReservation(Long userId, Long reservationId) {
		Reservation reservation = reservationRepository.findById(reservationId)
				.orElseThrow(() -> new NotFoundException("예약을 찾을 수 없습니다."));
		if (!reservation.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 예약만 조회/취소할 수 있습니다.");
		}
		return reservation;
	}
}
