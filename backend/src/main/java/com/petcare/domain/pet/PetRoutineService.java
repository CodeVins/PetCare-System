package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.RoutineRequest;
import com.petcare.domain.pet.dto.RoutineResponse;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 반복 일정 관리 + 완료 체크. 권한은 건강 기록과 같음(최초 등록자·공동보호자 동등)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetRoutineService {

	private final PetRoutineRepository petRoutineRepository;
	private final PetRepository petRepository;
	private final HealthRecordRepository healthRecordRepository;
	private final PetService petService;

	public List<RoutineResponse> list(Long userId, Long petId) {
		petService.verifyAccess(userId, petId);
		return petRoutineRepository.findAllByPetId(petId).stream()
				.sorted(Comparator.comparing(PetRoutine::getTime, Comparator.nullsFirst(Comparator.<LocalTime>naturalOrder()))
						.thenComparing(PetRoutine::getId))
				.map(RoutineResponse::from)
				.toList();
	}

	@Transactional
	public RoutineResponse create(Long userId, Long petId, RoutineRequest request) {
		petService.verifyAccess(userId, petId);
		validate(request);
		PetRoutine routine = PetRoutine.builder()
				.pet(petRepository.getReferenceById(petId))
				.type(request.type())
				.title(request.title())
				.time(request.time())
				.daysOfWeek(request.daysOfWeek())
				.startDate(request.startDate())
				.endDate(endDateOf(request))
				.build();
		return RoutineResponse.from(petRoutineRepository.save(routine));
	}

	@Transactional
	public RoutineResponse update(Long userId, Long petId, Long routineId, RoutineRequest request) {
		PetRoutine routine = getRoutine(userId, petId, routineId);
		validate(request);
		routine.update(request.type(), request.title(), request.time(), request.daysOfWeek(),
				request.startDate(), endDateOf(request));
		return RoutineResponse.from(routine);
	}

	// 이미 완료한 기록은 일반 건강 기록으로 남김
	@Transactional
	public void delete(Long userId, Long petId, Long routineId) {
		PetRoutine routine = getRoutine(userId, petId, routineId);
		healthRecordRepository.detachRoutine(routineId);
		petRoutineRepository.delete(routine);
	}

	// 완료 체크 = 같은 종류의 건강 기록 생성(기록 목록·통계에 그대로 쌓임). 하루 한 번, 일정이 있는 날·오늘까지만
	@Transactional
	public void check(Long userId, Long petId, Long routineId, LocalDate date) {
		PetRoutine routine = getRoutine(userId, petId, routineId);
		if (!routine.occursOn(date)) {
			throw new BadRequestException("이 날은 해당 일정이 없습니다.");
		}
		if (date.isAfter(LocalDate.now())) {
			throw new BadRequestException("아직 오지 않은 날은 완료할 수 없습니다.");
		}
		if (healthRecordRepository.existsByRoutineIdAndRecordedAt(routineId, date)) {
			throw new ConflictException("이미 완료한 일정입니다.");
		}
		healthRecordRepository.save(HealthRecord.builder()
				.pet(routine.getPet())
				.type(routine.getType())
				.recordedAt(date)
				.content(routine.getTitle())
				.routine(routine)
				.build());
	}

	@Transactional
	public void uncheck(Long userId, Long petId, Long routineId, LocalDate date) {
		getRoutine(userId, petId, routineId);
		HealthRecord record = healthRecordRepository.findByRoutineIdAndRecordedAt(routineId, date)
				.orElseThrow(() -> new NotFoundException("완료 기록이 없습니다."));
		healthRecordRepository.delete(record);
	}

	private PetRoutine getRoutine(Long userId, Long petId, Long routineId) {
		petService.verifyAccess(userId, petId);
		PetRoutine routine = petRoutineRepository.findById(routineId)
				.orElseThrow(() -> new NotFoundException("일정을 찾을 수 없습니다."));
		if (!routine.getPet().getId().equals(petId)) {
			throw new NotFoundException("일정을 찾을 수 없습니다.");
		}
		return routine;
	}

	private void validate(RoutineRequest request) {
		if (!PetRoutine.ALLOWED_TYPES.contains(request.type())) {
			throw new BadRequestException("반복 일정은 산책·식사·투약·미용만 만들 수 있습니다.");
		}
		LocalDate endDate = endDateOf(request);
		if (endDate != null && endDate.isBefore(request.startDate())) {
			throw new BadRequestException("종료일은 시작일보다 빠를 수 없습니다.");
		}
	}

	// 일회성 일정(요일 없음)은 종료일이 의미 없어서 비움
	private LocalDate endDateOf(RoutineRequest request) {
		boolean oneTime = request.daysOfWeek() == null || request.daysOfWeek().isEmpty();
		return oneTime ? null : request.endDate();
	}
}
