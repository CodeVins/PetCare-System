package com.petcare.domain.notification;

import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordRepository;
import com.petcare.domain.pet.PetGuardian;
import com.petcare.domain.pet.PetGuardianRepository;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ReminderScheduler {

	private final HealthRecordRepository healthRecordRepository;
	private final ReservationRepository reservationRepository;
	private final PetGuardianRepository petGuardianRepository;
	private final NotificationService notificationService;

	private static final int VACCINATION_REMIND_DAYS = 3;

	// 변경(2026-09-27): 정확히 D-3인 날만 → "오늘~D-3 사이 + 아직 안 보낸 것"으로 매칭하고 보낸 뒤 markReminded()
	// (이전: 09시에 서버가 꺼져 있으면 누락, 같은 날 여러 번 실행하면 중복 발송). 문구도 남은 일수를 실제로 계산
	@Transactional
	@Scheduled(cron = "0 0 9 * * *")
	public void sendVaccinationReminders() {
		LocalDate today = LocalDate.now();
		List<HealthRecord> dueSoon = healthRecordRepository.findUnremindedDueBetween(
				today, today.plusDays(VACCINATION_REMIND_DAYS));
		for (HealthRecord record : dueSoon) {
			long daysLeft = ChronoUnit.DAYS.between(today, record.getNextDueDate());
			String content = record.getPet().getName() + "의 다음 접종 예정일이 "
					+ (daysLeft == 0 ? "오늘입니다." : daysLeft + "일 남았습니다.");
			// 변경(2026-09-27): 최초 등록자 + 공동보호자 전원에게 발송 — 일상 관리 권한이 동등한데 알림만 등록자에게 가던 불일치
			// (이전: record.getPet().getUser()에게만)
			notificationService.notify(record.getPet().getUser().getId(), NotificationType.VACCINATION_DUE_SOON, content);
			for (PetGuardian guardian : petGuardianRepository.findAllByPetId(record.getPet().getId())) {
				notificationService.notify(guardian.getUser().getId(), NotificationType.VACCINATION_DUE_SOON, content);
			}
			record.markReminded();
		}
	}

	// 변경(2026-09-27): "내일 하루" → "지금~내일 끝 + 아직 안 보낸 것"으로 매칭하고 보낸 뒤 markReminderSent()
	// (이전: 같은 날 여러 번 실행하면 중복 발송, 전날 09시 이후에 확정된 오늘 예약은 알림을 못 받음)
	@Transactional
	@Scheduled(cron = "0 0 9 * * *")
	public void sendReservationReminders() {
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime end = now.toLocalDate().plusDays(2).atStartOfDay();

		List<Reservation> reservations = reservationRepository.findUnremindedConfirmedStartingBetween(now, end);
		for (Reservation reservation : reservations) {
			boolean isToday = reservation.getSlot().getStartTime().toLocalDate().equals(now.toLocalDate());
			notificationService.notify(reservation.getUser().getId(), NotificationType.RESERVATION_REMINDER,
					isToday ? "오늘 예약이 있습니다." : "내일 예약이 있습니다.");
			reservation.markReminderSent();
		}
	}
}
