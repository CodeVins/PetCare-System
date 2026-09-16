package com.petcare.domain.notification;

import com.petcare.domain.notification.dto.NotificationResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService notificationService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(ApiResponse.success(notificationService.getMyNotifications(userDetails.getUser().getId())));
	}

	@PatchMapping("/{notificationId}/read")
	public ResponseEntity<ApiResponse<Void>> markAsRead(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long notificationId) {
		notificationService.markAsRead(userDetails.getUser().getId(), notificationId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
