package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.HealthRecordCreateRequest;
import com.petcare.domain.pet.dto.HealthRecordResponse;
import com.petcare.domain.pet.dto.HealthRecordSummaryResponse;
import com.petcare.domain.pet.dto.HealthRecordUpdateRequest;
import com.petcare.domain.pet.dto.WeightPoint;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthRecordService {

	private final HealthRecordRepository healthRecordRepository;
	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;

	@Transactional
	public HealthRecordResponse create(Long userId, Long petId, HealthRecordCreateRequest request) {
		Pet pet = getOwnedPet(userId, petId);
		HealthRecord record = HealthRecord.builder()
				.pet(pet)
				.type(request.type())
				.recordedAt(request.recordedAt())
				.content(request.content())
				.weight(request.weight())
				.nextDueDate(request.nextDueDate())
				.build();

		return HealthRecordResponse.from(healthRecordRepository.save(record));
	}

	public PageResponse<HealthRecordResponse> getRecords(Long userId, Long petId, Pageable pageable) {
		getOwnedPet(userId, petId);
		return PageResponse.from(healthRecordRepository.findAllByPetId(petId, pageable).map(HealthRecordResponse::from));
	}

	@Transactional
	public HealthRecordResponse update(Long userId, Long petId, Long recordId, HealthRecordUpdateRequest request) {
		HealthRecord record = getOwnedRecord(userId, petId, recordId);
		record.update(request.type(), request.recordedAt(), request.content(), request.weight(), request.nextDueDate());
		return HealthRecordResponse.from(record);
	}

	public HealthRecordSummaryResponse getSummary(Long userId, Long petId) {
		getOwnedPet(userId, petId);

		List<WeightPoint> weightHistory = healthRecordRepository
				.findAllByPetIdAndTypeOrderByRecordedAtAsc(petId, HealthRecordType.WEIGHT).stream()
				.map(record -> new WeightPoint(record.getRecordedAt(), record.getWeight()))
				.toList();
		Double latestWeight = weightHistory.isEmpty() ? null : weightHistory.get(weightHistory.size() - 1).weight();

		Map<HealthRecordType, Long> countByType = new LinkedHashMap<>();
		for (HealthRecordType type : Arrays.asList(HealthRecordType.values())) {
			countByType.put(type, healthRecordRepository.countByPetIdAndType(petId, type));
		}

		return new HealthRecordSummaryResponse(weightHistory, latestWeight, countByType);
	}

	@Transactional
	public void delete(Long userId, Long petId, Long recordId) {
		HealthRecord record = getOwnedRecord(userId, petId, recordId);
		healthRecordRepository.delete(record);
	}

	private HealthRecord getOwnedRecord(Long userId, Long petId, Long recordId) {
		getOwnedPet(userId, petId);
		HealthRecord record = healthRecordRepository.findById(recordId)
				.orElseThrow(() -> new NotFoundException("건강 기록을 찾을 수 없습니다."));
		if (!record.getPet().getId().equals(petId)) {
			throw new NotFoundException("건강 기록을 찾을 수 없습니다.");
		}
		return record;
	}

	private Pet getOwnedPet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId) && !petGuardianRepository.existsByPetIdAndUserId(petId, userId)) {
			throw new ForbiddenException("본인 또는 공동보호자로 등록된 반려동물만 조회할 수 있습니다.");
		}
		return pet;
	}
}
