package com.petcare.domain.notification;

import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(30)")
	private NotificationType type;

	@Column(nullable = false)
	private String content;

	@Column(name = "is_read", nullable = false)
	private boolean read;

	@Builder
	private Notification(User user, NotificationType type, String content) {
		this.user = user;
		this.type = type;
		this.content = content;
		this.read = false;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	public void markAsRead() {
		this.read = true;
	}
}
