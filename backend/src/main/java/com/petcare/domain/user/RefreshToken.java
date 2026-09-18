package com.petcare.domain.user;

import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(nullable = false, unique = true)
	private String token;

	@Column(nullable = false)
	private LocalDateTime expiresAt;

	@Builder
	private RefreshToken(User user, String token, LocalDateTime expiresAt) {
		this.user = user;
		this.token = token;
		this.expiresAt = expiresAt;
	}

	public boolean isExpired() {
		return expiresAt.isBefore(LocalDateTime.now());
	}

	public void rotate(String token, LocalDateTime expiresAt) {
		this.token = token;
		this.expiresAt = expiresAt;
	}
}
