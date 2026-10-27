package com.petcare.domain.user;

import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
}
