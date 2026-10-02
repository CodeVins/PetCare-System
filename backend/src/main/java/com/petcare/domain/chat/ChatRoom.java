package com.petcare.domain.chat;

import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "hospital_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	private User customer;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "hospital_id", nullable = false)
	private Hospital hospital;

	// 양쪽(고객 / 병원 측)이 마지막으로 읽은 메시지 id — 안 읽은 메시지 수 계산용, null이면 아직 하나도 안 읽음
	private Long customerLastReadMessageId;

	private Long hospitalLastReadMessageId;

	@Builder
	private ChatRoom(User customer, Hospital hospital) {
		this.customer = customer;
		this.hospital = hospital;
	}

	public boolean canAccess(User user) {
		return customer.getId().equals(user.getId()) || hospital.isManagedBy(user);
	}

	// ADMIN은 중재 목적 열람이라 읽음 처리 안 함 — 관리자가 열어봤다고 병원 소유자의 안 읽음 표시가 사라지면 안 됨
	public void markReadBy(User user, Long messageId) {
		if (customer.getId().equals(user.getId())) {
			customerLastReadMessageId = messageId;
		} else if (hospital.getOwner() != null && hospital.getOwner().getId().equals(user.getId())) {
			hospitalLastReadMessageId = messageId;
		}
	}
}
