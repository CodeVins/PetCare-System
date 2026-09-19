package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.SlotCreateRequest;
import com.petcare.domain.hospital.dto.SlotResponse;
import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.user.User;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.BadRequestException;
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
public class SlotService {

	private final SlotRepository slotRepository;
	private final HospitalService hospitalService;
	private final FavoriteRepository favoriteRepository;
	private final NotificationService notificationService;

	@Transactional
	public SlotResponse create(User currentUser, Long hospitalId, SlotCreateRequest request) {
		if (!request.endTime().isAfter(request.startTime())) {
			throw new BadRequestException("종료 시간은 시작 시간보다 늦어야 합니다.");
		}

		Hospital hospital = hospitalService.findHospital(hospitalId);
		if (!hospital.isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원을 관리할 권한이 없습니다.");
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

	private void notifyFavoriters(Hospital hospital) {
		String content = "찜한 병원 '" + hospital.getName() + "'에 새로운 예약 가능 시간이 열렸습니다.";
		for (Favorite favorite : favoriteRepository.findAllByHospitalId(hospital.getId())) {
			notificationService.notify(favorite.getUser().getId(), NotificationType.FAVORITE_HOSPITAL_NEW_SLOT, content);
		}
	}

	public PageResponse<SlotResponse> getSlots(Long hospitalId, SlotStatus status, Pageable pageable) {
		Page<Slot> slots = status != null
				? slotRepository.findAllByHospitalIdAndStatus(hospitalId, status, pageable)
				: slotRepository.findAllByHospitalId(hospitalId, pageable);

		return PageResponse.from(slots.map(SlotResponse::from));
	}

	Slot findSlot(Long slotId) {
		return slotRepository.findById(slotId)
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
	}
}
