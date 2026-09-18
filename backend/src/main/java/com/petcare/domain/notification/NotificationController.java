package com.petcare.domain.notification;

import com.petcare.domain.notification.dto.NotificationResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

	private final NotificationService notificationService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getMyNotifications(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(
				ApiResponse.success(notificationService.getMyNotifications(userDetails.getUser().getId(), pageable)));
	}

	@GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter subscribe(@AuthenticationPrincipal CustomUserDetails userDetails) {
		return notificationService.subscribe(userDetails.getUser().getId());
	}

	@GetMapping("/unread-count")
	public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(userDetails.getUser().getId())));
	}

	@PatchMapping("/{notificationId}/read")
	public ResponseEntity<ApiResponse<Void>> markAsRead(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long notificationId) {
		notificationService.markAsRead(userDetails.getUser().getId(), notificationId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
