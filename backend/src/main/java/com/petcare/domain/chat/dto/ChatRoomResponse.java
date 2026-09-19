package com.petcare.domain.chat.dto;

import com.petcare.domain.chat.ChatRoom;

public record ChatRoomResponse(Long id, Long hospitalId, String hospitalName, Long customerId, String customerEmail) {

	public static ChatRoomResponse from(ChatRoom room) {
		return new ChatRoomResponse(
				room.getId(), room.getHospital().getId(), room.getHospital().getName(), room.getCustomer().getId(),
				room.getCustomer().getEmail());
	}
}
