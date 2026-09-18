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

	@Builder
	private ChatRoom(User customer, Hospital hospital) {
		this.customer = customer;
		this.hospital = hospital;
	}

	public boolean canAccess(User user) {
		return customer.getId().equals(user.getId()) || hospital.isManagedBy(user);
	}
}
