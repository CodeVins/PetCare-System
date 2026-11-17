package com.petcare.domain.admin;

import com.petcare.domain.notification.ReminderScheduler;
import com.petcare.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reminders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReminderController {

	private final ReminderScheduler reminderScheduler;

	@PostMapping("/run")
	public ResponseEntity<ApiResponse<Void>> runNow() {
		reminderScheduler.sendVaccinationReminders();
		reminderScheduler.sendReservationReminders();
		// 변경(2026-11-17): 루틴 알림도 즉시 실행에 포함(평소엔 1분마다) (이전: 접종·예약만)
		reminderScheduler.sendRoutineReminders();
		return ResponseEntity.ok(ApiResponse.success());
	}
}
