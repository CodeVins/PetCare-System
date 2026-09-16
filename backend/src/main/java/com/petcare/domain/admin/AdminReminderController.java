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
		return ResponseEntity.ok(ApiResponse.success());
	}
}
