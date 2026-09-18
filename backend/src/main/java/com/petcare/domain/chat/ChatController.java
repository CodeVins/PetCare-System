package com.petcare.domain.chat;

import com.petcare.domain.chat.dto.ChatMessageCreateRequest;
import com.petcare.domain.chat.dto.ChatMessageResponse;
import com.petcare.domain.chat.dto.ChatRoomCreateRequest;
import com.petcare.domain.chat.dto.ChatRoomResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat-rooms")
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;

	@PostMapping
	public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreateRoom(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody ChatRoomCreateRequest request) {
		ChatRoomResponse response = chatService.getOrCreateRoom(userDetails.getUser().getId(), request.hospitalId());
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<ChatRoomResponse>>> getMyRooms(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(chatService.getMyRooms(userDetails.getUser(), pageable)));
	}

	@GetMapping("/{roomId}/messages")
	public ResponseEntity<ApiResponse<PageResponse<ChatMessageResponse>>> getMessages(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long roomId,
			@PageableDefault(size = 50) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(chatService.getMessages(userDetails.getUser(), roomId, pageable)));
	}

	@PostMapping("/{roomId}/messages")
	public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long roomId,
			@Valid @RequestBody ChatMessageCreateRequest request) {
		ChatMessageResponse response = chatService.sendMessage(userDetails.getUser(), roomId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}
}
