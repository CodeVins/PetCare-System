package com.petcare.domain.notification;

import com.petcare.domain.pet.HealthRecord;
import com.petcare.domain.pet.HealthRecordRepository;
import com.petcare.domain.reservation.Reservation;
import com.petcare.domain.reservation.ReservationRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
	private final NotificationService notificationService;

	// ponytail: exact-day match with no dedup flag — if the server is down at 09:00 on the exact
	// due date, that reminder is silently missed. Upgrade: add a `reminderSent` flag + a date-range
	// catch-up check if missed reminders become a problem.
	@Transactional
	@Scheduled(cron = "0 0 9 * * *")
	public void sendVaccinationReminders() {
		LocalDate targetDate = LocalDate.now().plusDays(3);
		List<HealthRecord> dueSoon = healthRecordRepository.findAllByNextDueDate(targetDate);
		for (HealthRecord record : dueSoon) {
			Long userId = record.getPet().getUser().getId();
			String content = record.getPet().getName() + "의 다음 접종 예정일이 3일 남았습니다.";
			notificationService.notify(userId, NotificationType.VACCINATION_DUE_SOON, content);
		}
	}

	@Transactional
	@Scheduled(cron = "0 0 9 * * *")
	public void sendReservationReminders() {
		LocalDate tomorrow = LocalDate.now().plusDays(1);
		LocalDateTime start = tomorrow.atStartOfDay();
		LocalDateTime end = tomorrow.plusDays(1).atStartOfDay();

		List<Reservation> reservations = reservationRepository.findConfirmedReservationsStartingBetween(start, end);
		for (Reservation reservation : reservations) {
			Long userId = reservation.getUser().getId();
			notificationService.notify(userId, NotificationType.RESERVATION_REMINDER, "내일 예약이 있습니다.");
		}
	}
}
