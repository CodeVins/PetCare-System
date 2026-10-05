package com.petcare.domain.reservation;

import com.petcare.domain.hospital.Slot;
import com.petcare.domain.hospital.SlotRepository;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetGuardianRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.dto.WaitlistCreateRequest;
import com.petcare.domain.reservation.dto.WaitlistResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaitlistService {

	// 차례를 받은 사람이 예약할 수 있는 시간 — 지나면 다음 대기자에게
	public static final int OFFER_MINUTES = 30;

	private final WaitlistRepository waitlistRepository;
	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;
	private final SlotRepository slotRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	@Transactional
	public WaitlistResponse join(Long userId, WaitlistCreateRequest request) {
		Pet pet = petRepository.findById(request.petId())
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId) && !petGuardianRepository.existsByPetIdAndUserId(pet.getId(), userId)) {
			throw new ForbiddenException("본인 또는 공동보호자로 등록된 반려동물만 대기 신청할 수 있습니다.");
		}

		Slot slot = slotRepository.findById(request.slotId())
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
		// 변경(2026-09-27): 이미 시작된 슬롯 대기 신청 차단 (이전: 지난 슬롯에도 대기 등록 가능)
		if (slot.hasStarted()) {
			throw new ConflictException("이미 지난 시간에는 대기 신청할 수 없습니다.");
		}
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

	// 변경(2026-10-05): 알림 즉시 항목을 지우던 방식 → "차례 제안"(offeredAt 기록)으로. OFFER_MINUTES 안에 예약하지 않으면
	// WaitlistOfferScheduler가 다음 사람에게 넘김 (이전: 1순위에게만 알리고 삭제 — 그 사람이 안 잡으면 다음 사람에게 안 넘어감).
	// 여전히 한 번에 한 명에게만 알림(선착순 알림 스탬피드 방지)
	@Transactional
	public void notifyNextInLine(Slot slot) {
		// 변경(2026-09-27): 지난 슬롯이면 대기자 알림 생략 — 취소/거절 호출부 전부 여기를 거치므로 한 곳에서 막음
		// (이전: 지난 PENDING 예약을 거절해도 이미 지난 시간에 대해 "예약 가능해졌습니다" 알림 발송)
		if (slot.hasStarted()) {
			return;
		}
		// 슬롯이 다시 열렸으면 예전에 차례를 받았던 사람은 이미 한 번 기회를 가졌으므로 정리하고 다음 사람에게
		waitlistRepository.deleteAll(waitlistRepository.findAllBySlotIdAndOfferedAtIsNotNull(slot.getId()));
		waitlistRepository.findFirstBySlotIdAndOfferedAtIsNullOrderByCreatedAtAsc(slot.getId()).ifPresent(waitlist -> {
			waitlist.markOffered(LocalDateTime.now());
			notificationService.notify(
					waitlist.getUser().getId(), NotificationType.WAITLIST_SLOT_AVAILABLE,
					"대기 신청하신 시간이 예약 가능해졌습니다. " + OFFER_MINUTES
							+ "분 안에 예약하지 않으면 다음 대기자에게 차례가 넘어갑니다.");
		});
	}

	// 슬롯이 예약되면 차례 제안은 끝 — 차례를 받은 항목 정리(본인이 잡았든 다른 사람이 잡았든)
	@Transactional
	public void closeOffers(Slot slot) {
		waitlistRepository.deleteAll(waitlistRepository.findAllBySlotIdAndOfferedAtIsNotNull(slot.getId()));
	}

	// 차례 시간이 지난 항목 처리 — 스케줄러가 1분마다 호출. 슬롯이 아직 비어 있고 시작 전이면 다음 사람에게 넘기고,
	// 이미 예약됐거나 지난 슬롯이면 정리만. 반환값은 처리한 만료 항목 수
	@Transactional
	public int handOffExpiredOffers() {
		List<Waitlist> expired = waitlistRepository.findAllOfferedBefore(LocalDateTime.now().minusMinutes(OFFER_MINUTES));
		for (Waitlist waitlist : expired) {
			Slot slot = waitlist.getSlot();
			waitlistRepository.delete(waitlist);
			if (slot.isAvailable() && !slot.hasStarted()) {
				notifyNextInLine(slot);
			}
		}
		return expired.size();
	}
}
