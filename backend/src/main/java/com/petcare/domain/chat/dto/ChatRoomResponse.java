package com.petcare.domain.chat.dto;

import com.petcare.domain.chat.ChatRoom;

// 변경(2026-10-02): unreadCount 추가 — 채팅 목록 칸마다 안 읽은 메시지 수 표시 (이전: 방 정보만)
public record ChatRoomResponse(
		Long id, Long hospitalId, String hospitalName, Long customerId, String customerEmail, long unreadCount) {

	public static ChatRoomResponse from(ChatRoom room) {
		return of(room, 0);
	}

	public static ChatRoomResponse of(ChatRoom room, long unreadCount) {
		return new ChatRoomResponse(
				room.getId(), room.getHospital().getId(), room.getHospital().getName(), room.getCustomer().getId(),
				room.getCustomer().getEmail(), unreadCount);
	}
}
