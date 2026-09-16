package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.dto.ReservationCreateRequest;
import com.petcare.domain.reservation.dto.ReservationResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
				.status(ReservationStatus.CONFIRMED)
				.build();

		ReservationResponse response = ReservationResponse.from(reservationRepository.save(reservation));
		notificationService.notify(userId, NotificationType.RESERVATION_CONFIRMED, "예약이 확정되었습니다.");
		return response;
	}

	public List<ReservationResponse> getMyReservations(Long userId) {
		return reservationRepository.findAllByUserId(userId).stream()
				.map(ReservationResponse::from)
				.toList();
	}

	public ReservationResponse get(Long userId, Long reservationId) {
		return ReservationResponse.from(getOwnedReservation(userId, reservationId));
	}

	@Transactional
	public void cancel(Long userId, Long reservationId) {
		Reservation reservation = getOwnedReservation(userId, reservationId);
		if (reservation.getStatus() == ReservationStatus.CANCELLED) {
			throw new ConflictException("이미 취소된 예약입니다.");
		}
		reservation.cancel();
		reservation.getSlot().release();
		notificationService.notify(userId, NotificationType.RESERVATION_CANCELLED, "예약이 취소되었습니다.");
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
