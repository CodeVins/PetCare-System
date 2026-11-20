package com.petcare.domain.user;

import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String password;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(20)")
	private Role role;

	@Column(nullable = false)
	private boolean suspended;

	// 카카오 회원번호 — 카카오 로그인으로 가입·연결된 계정만 값이 있음(이메일이 바뀌어도 이걸로 찾음)
	@Column(unique = true)
	private Long kakaoId;

	// 탈퇴 시각 — 탈퇴 계정은 행을 남기고(예약·리뷰·채팅 이력의 FK) 이메일·비밀번호·카카오 연결을 지운 뒤 정지 상태로 둠
	@Column(name = "withdrawn_at")
	private LocalDateTime withdrawnAt;

	@Builder
	private User(String email, String password, Role role, Long kakaoId) {
		this.email = email;
		this.password = password;
		this.role = role;
		this.kakaoId = kakaoId;
		this.suspended = false;
	}

	public void linkKakao(Long kakaoId) {
		this.kakaoId = kakaoId;
	}

	public void changeEmail(String email) {
		this.email = email;
	}

	public void changePassword(String encodedPassword) {
		this.password = encodedPassword;
	}

	public void changeRole(Role role) {
		this.role = role;
	}

	public void suspend() {
		this.suspended = true;
	}

	public void activate() {
		this.suspended = false;
	}

	// 원래 이메일로 다시 가입할 수 있게 이메일을 자리표시 값으로 바꾸고, 비밀번호·카카오 연결로도 못 들어오게
	public void withdraw(String encodedRandomPassword) {
		this.email = "withdrawn-" + id + "@petcare.invalid";
		this.password = encodedRandomPassword;
		this.kakaoId = null;
		this.suspended = true;
		this.withdrawnAt = LocalDateTime.now();
	}

	public boolean isWithdrawn() {
		return withdrawnAt != null;
	}
}
