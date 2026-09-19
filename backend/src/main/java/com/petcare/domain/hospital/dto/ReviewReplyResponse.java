package com.petcare.domain.hospital.dto;

import com.petcare.domain.hospital.ReviewReply;
import java.time.LocalDateTime;

public record ReviewReplyResponse(Long id, String content, LocalDateTime createdAt) {

	public static ReviewReplyResponse from(ReviewReply reply) {
		return new ReviewReplyResponse(reply.getId(), reply.getContent(), reply.getCreatedAt());
	}
}
