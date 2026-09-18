package com.petcare.domain.chat.dto;

import com.petcare.domain.chat.ChatMessage;
import java.time.LocalDateTime;

public record ChatMessageResponse(
		Long id, Long roomId, Long senderId, String senderEmail, String content, LocalDateTime createdAt) {

	public static ChatMessageResponse from(ChatMessage message) {
		return new ChatMessageResponse(
				message.getId(), message.getChatRoom().getId(), message.getSender().getId(),
				message.getSender().getEmail(), message.getContent(), message.getCreatedAt());
	}
}
