package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.dto.WaitlistCreateRequest;
import com.petcare.domain.reservation.dto.WaitlistResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

	private final WaitlistRepository waitlistRepository;
	private final PetRepository petRepository;
	private final SlotRepository slotRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	@Transactional
	public WaitlistResponse join(Long userId, WaitlistCreateRequest request) {
		Pet pet = petRepository.findById(request.petId())
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 반려동물만 대기 신청할 수 있습니다.");
		}

		Slot slot = slotRepository.findById(request.slotId())
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
		if (slot.isAvailable()) {
			throw new ConflictException("지금 바로 예약할 수 있는 시간입니다. 대기 신청이 필요 없습니다.");
		}
		if (waitlistRepository.existsBySlotIdAndUserId(slot.getId(), userId)) {
			throw new ConflictException("이미 대기 신청한 시간입니다.");
		}

		User user = userRepository.getReferenceById(userId);
		Waitlist waitlist = Waitlist.builder().slot(slot).pet(pet).user(user).build();
		return WaitlistResponse.from(waitlistRepository.save(waitlist));
	}

	public PageResponse<WaitlistResponse> getMyWaitlist(Long userId, Pageable pageable) {
		return PageResponse.from(waitlistRepository.findAllByUserId(userId, pageable).map(WaitlistResponse::from));
	}

	@Transactional
	public void leave(Long userId, Long waitlistId) {
		Waitlist waitlist = waitlistRepository.findById(waitlistId)
				.orElseThrow(() -> new NotFoundException("대기 신청 내역을 찾을 수 없습니다."));
		if (!waitlist.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 대기 신청만 취소할 수 있습니다.");
		}
		waitlistRepository.delete(waitlist);
	}

	// ponytail: 대기 1순위 한 명에게만 알리고 항목을 지움(선착순 재예약 필요). 여러 명에게 동시 알리는
	// "먼저 예약하는 사람이 임자" 방식이 필요해지면 여기서 findAllBySlotIdOrderByCreatedAtAsc로 바꿀 것.
	@Transactional
	public void notifyNextInLine(Slot slot) {
		waitlistRepository.findFirstBySlotIdOrderByCreatedAtAsc(slot.getId()).ifPresent(waitlist -> {
			notificationService.notify(
					waitlist.getUser().getId(), NotificationType.WAITLIST_SLOT_AVAILABLE,
					"대기 신청하신 시간이 예약 가능해졌습니다. 서둘러 예약해주세요.");
			waitlistRepository.delete(waitlist);
		});
	}
}
