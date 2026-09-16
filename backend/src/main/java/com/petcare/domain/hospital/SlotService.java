package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.SlotCreateRequest;
import com.petcare.domain.hospital.dto.SlotResponse;
import com.petcare.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SlotService {

	private final SlotRepository slotRepository;
	private final HospitalService hospitalService;

	@Transactional
	public SlotResponse create(Long hospitalId, SlotCreateRequest request) {
		Hospital hospital = hospitalService.findHospital(hospitalId);
		Slot slot = Slot.builder()
				.hospital(hospital)
				.startTime(request.startTime())
				.endTime(request.endTime())
				.build();

		return SlotResponse.from(slotRepository.save(slot));
	}

	public List<SlotResponse> getSlots(Long hospitalId, SlotStatus status) {
		List<Slot> slots = status != null
				? slotRepository.findAllByHospitalIdAndStatus(hospitalId, status)
				: slotRepository.findAllByHospitalId(hospitalId);

		return slots.stream().map(SlotResponse::from).toList();
	}

	Slot findSlot(Long slotId) {
		return slotRepository.findById(slotId)
				.orElseThrow(() -> new NotFoundException("예약 가능 시간을 찾을 수 없습니다."));
	}
}
