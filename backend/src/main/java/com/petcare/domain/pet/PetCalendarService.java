package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.CalendarEventResponse;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.global.exception.BadRequestException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 반려동물 캘린더 — 새 테이블 없이 예약·건강 기록·다음 예정일을 기간별로 모아 보여줌.
// 범위는 내 펫 + 공동보호자로 등록된 펫(가족 펫의 일정은 누가 예약·기록했든 같이 보임)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetCalendarService {

	// 월 보기 + 앞뒤 주(최대 6주 = 42일)를 넉넉히 덮는 값
	public static final int MAX_DAYS = 62;

	// 취소·거절은 일어나지 않을 일정이라 뺌
	private static final List<ReservationStatus> SHOWN_STATUSES =
			List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.NO_SHOW);

	private final ReservationRepository reservationRepository;
	private final HealthRecordRepository healthRecordRepository;
	private final PetRoutineRepository petRoutineRepository;

	// petId는 필터일 뿐 — 접근할 수 없는 펫이면 쿼리 조건에 걸려 빈 결과
	public List<CalendarEventResponse> getEvents(Long userId, Long petId, LocalDate from, LocalDate to) {
		if (to.isBefore(from)) {
			throw new BadRequestException("종료일은 시작일보다 빠를 수 없습니다.");
		}
		if (ChronoUnit.DAYS.between(from, to) >= MAX_DAYS) {
			throw new BadRequestException("한 번에 최대 " + MAX_DAYS + "일까지 조회할 수 있습니다.");
		}

		List<CalendarEventResponse> events = new ArrayList<>();
		reservationRepository.findAllAccessibleStartingBetween(
						userId, petId, SHOWN_STATUSES, from.atStartOfDay(), to.plusDays(1).atStartOfDay())
				.forEach(reservation -> events.add(CalendarEventResponse.ofReservation(reservation)));
		// 한 기록이 기록일·예정일 둘 다 기간 안이면 이벤트 2개.
		// 루틴 완료 기록은 RECORD로 따로 찍지 않고 그날 ROUTINE 이벤트의 done으로만 표시(중복 방지)
		Set<String> doneRoutineDays = new HashSet<>();
		for (HealthRecord record : healthRecordRepository.findAllAccessibleInRange(userId, petId, from, to)) {
			if (record.getRoutine() != null) {
				doneRoutineDays.add(record.getRoutine().getId() + ":" + record.getRecordedAt());
				continue;
			}
			if (!record.getRecordedAt().isBefore(from) && !record.getRecordedAt().isAfter(to)) {
				events.add(CalendarEventResponse.ofRecord(record));
			}
			LocalDate due = record.getNextDueDate();
			if (due != null && !due.isBefore(from) && !due.isAfter(to)) {
				events.add(CalendarEventResponse.ofDue(record));
			}
		}
		// 반복 일정은 저장된 행이 아니라 기간만큼 펼쳐서 만듦
		for (PetRoutine routine : petRoutineRepository.findAllAccessibleOverlapping(userId, petId, from, to)) {
			for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
				if (routine.occursOn(date)) {
					boolean done = doneRoutineDays.contains(routine.getId() + ":" + date);
					events.add(CalendarEventResponse.ofRoutine(routine, date, done));
				}
			}
		}
		// 날짜순, 같은 날은 시간 없는 것(기록·예정일) 먼저 → 예약·루틴 시간순
		events.sort(Comparator.comparing(CalendarEventResponse::date)
				.thenComparing(CalendarEventResponse::time, Comparator.nullsFirst(Comparator.<LocalTime>naturalOrder())));
		return events;
	}
}
