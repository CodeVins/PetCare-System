package com.petcare.domain.reservation;

import com.petcare.domain.notification.NotificationService;
import com.petcare.domain.notification.NotificationType;
import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordRepository;
import com.petcare.domain.pet.HealthRecordType;
import com.petcare.domain.pet.dto.HealthRecordResponse;
import com.petcare.domain.reservation.dto.TreatmentRecordRequest;
import com.petcare.domain.user.User;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDate;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 병원이 진료 후 남기는 기록. 별도 테이블 없이 반려동물 건강 기록(HealthRecord)에 예약을 연결해서 저장 —
 * 보호자의 건강 기록 타임라인에 그대로 나오고, nextDueDate를 주면 기존 D-day 리마인더가 그대로 동작함.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TreatmentRecordService {

	private static final Set<HealthRecordType> ALLOWED_TYPES = Set.of(HealthRecordType.TREATMENT, HealthRecordType.VACCINATION);

	private final ReservationRepository reservationRepository;
	private final HealthRecordRepository healthRecordRepository;
	private final NotificationService notificationService;

	public HealthRecordResponse get(User currentUser, Long reservationId) {
		Reservation reservation = findManagedReservation(currentUser, reservationId);
		return healthRecordRepository.findByReservationId(reservation.getId())
				.map(HealthRecordResponse::from)
				.orElse(null);
	}

	// 예약당 기록 1개 — 있으면 수정, 없으면 생성(생성 때만 예약자에게 알림)
	@Transactional
	public HealthRecordResponse save(User currentUser, Long reservationId, TreatmentRecordRequest request) {
		Reservation reservation = findManagedReservation(currentUser, reservationId);
		if (!ALLOWED_TYPES.contains(request.type())) {
			throw new BadRequestException("진료 기록은 진료 또는 접종만 선택할 수 있습니다.");
		}
		if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
			throw new ConflictException("확정된 예약만 진료 기록을 작성할 수 있습니다.");
		}
		if (!reservation.getSlot().hasStarted()) {
			throw new ConflictException("예약 시간이 지난 뒤에 진료 기록을 작성할 수 있습니다.");
		}
		LocalDate visitDate = reservation.getSlot().getStartTime().toLocalDate();
		if (request.nextDueDate() != null && !request.nextDueDate().isAfter(visitDate)) {
			throw new BadRequestException("다음 예정일은 진료일 이후로 입력해주세요.");
		}

		HealthRecord record = healthRecordRepository.findByReservationId(reservation.getId()).orElse(null);
		if (record != null) {
			record.updateTreatment(request.type(), request.content(), request.nextDueDate());
			return HealthRecordResponse.from(record);
		}

		record = healthRecordRepository.save(HealthRecord.builder()
				.pet(reservation.getPet())
				.type(request.type())
				.recordedAt(visitDate)
				.content(request.content())
				.nextDueDate(request.nextDueDate())
				.reservation(reservation)
				.build());
		notificationService.notify(reservation.getUser().getId(), NotificationType.TREATMENT_RECORDED,
				reservation.getSlot().getHospital().getName() + "에서 " + reservation.getPet().getName()
						+ "의 진료 기록을 등록했습니다.");
		return HealthRecordResponse.from(record);
	}

	private Reservation findManagedReservation(User currentUser, Long reservationId) {
		Reservation reservation = reservationRepository.findById(reservationId)
				.orElseThrow(() -> new NotFoundException("예약을 찾을 수 없습니다."));
		if (!reservation.getSlot().getHospital().isManagedBy(currentUser)) {
			throw new ForbiddenException("해당 병원의 예약을 관리할 권한이 없습니다.");
		}
		return reservation;
	}
}
