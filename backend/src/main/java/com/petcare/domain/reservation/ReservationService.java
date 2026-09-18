package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.dto.ReservationCreateRequest;
import com.petcare.domain.reservation.dto.ReservationResponse;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

	private final ReservationRepository reservationRepository;
	private final PetRepository petRepository;
	private final SlotRepository slotRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;
	private final WaitlistService waitlistService;

	@Transactional
	public ReservationResponse create(Long userId, ReservationCreateRequest request) {
		Pet pet = petRepository.findById(request.petId())
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 반려동물만 예약할 수 있습니다.");
		}

		Slot slot = slotRepository.findById(request.slotId())
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
		if (!slot.isAvailable()) {
			throw new ConflictException("이미 예약된 시간입니다.");
		}
		slot.reserve();

		User user = userRepository.getReferenceById(userId);
		Reservation reservation = Reservation.builder()
				.slot(slot)
				.pet(pet)
				.user(user)
				.status(ReservationStatus.PENDING)
				.build();

		ReservationResponse response = ReservationResponse.from(reservationRepository.save(reservation));
		notificationService.notify(userId, NotificationType.RESERVATION_REQUESTED, "예약 요청이 접수되었습니다. 병원 확인을 기다려주세요.");
		return response;
	}

	public PageResponse<ReservationResponse> getMyReservations(Long userId, Pageable pageable) {
		return PageResponse.from(reservationRepository.findAllByUserId(userId, pageable).map(ReservationResponse::from));
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
		reservation.cancel();
		reservation.getSlot().release();
		notificationService.notify(userId, NotificationType.RESERVATION_CANCELLED, "예약이 취소되었습니다.");
		waitlistService.notifyNextInLine(reservation.getSlot());
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
