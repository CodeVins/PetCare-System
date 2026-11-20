package com.petcare.domain.user;

import com.petcare.domain.hospital.FavoriteRepository;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.notification.NotificationPreferenceRepository;
import com.petcare.domain.notification.NotificationRepository;
import com.petcare.domain.pet.Pet;
import com.petcare.domain.pet.PetGuardianRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.pet.PetService;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.reservation.WaitlistRepository;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.BadRequestException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 탈퇴 — 유저 행은 지우지 않고 익명화 + 정지(예약·리뷰·채팅·진료 기록이 user FK로 참조하고,
 * 병원 통계·리뷰 자격도 그 이력에 기대서 — Pet 삭제 정책과 같은 이유).
 * 지우는 것: 로그인 수단(이메일·비밀번호·카카오 연결·refreshToken), 개인 설정·찜·대기·알림, 공동보호자 참여,
 * 예약 이력이 없는 내 반려동물(건강 기록·루틴 포함). 예약 이력이 있는 반려동물은 남음(공동보호자는 계속 관리 가능).
 */
@Service
@RequiredArgsConstructor
public class WithdrawalService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final HospitalRepository hospitalRepository;
	private final ReservationRepository reservationRepository;
	private final PetRepository petRepository;
	private final PetService petService;
	private final PetGuardianRepository petGuardianRepository;
	private final FavoriteRepository favoriteRepository;
	private final WaitlistRepository waitlistRepository;
	private final NotificationRepository notificationRepository;
	private final NotificationPreferenceRepository notificationPreferenceRepository;

	@Transactional
	public void withdraw(Long userId, String password) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
		// 카카오 로그인 계정은 비밀번호를 모름(가입 시 랜덤) — 로그인된 토큰으로만 확인
		if (user.getKakaoId() == null && (password == null || !passwordEncoder.matches(password, user.getPassword()))) {
			// 401이 아니라 400 — 401이면 프론트가 토큰 만료로 보고 재발급을 시도함
			throw new BadRequestException("비밀번호가 올바르지 않습니다.");
		}
		if (user.getRole() == Role.ADMIN) {
			throw new ConflictException("관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한 해제를 요청해주세요.");
		}
		if (!hospitalRepository.findAllByOwnerIdOrderByNameAsc(userId).isEmpty()) {
			throw new ConflictException("관리 중인 병원이 있어 탈퇴할 수 없습니다. 관리자에게 소유자 변경을 요청해주세요.");
		}
		if (reservationRepository.existsByUserIdAndStatusInAndSlot_StartTimeAfter(
				userId, EnumSet.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED), LocalDateTime.now())) {
			throw new ConflictException("다가오는 예약이 있어 탈퇴할 수 없습니다. 먼저 예약을 취소해주세요.");
		}

		for (Pet pet : petRepository.findAllByUserId(userId)) {
			if (!reservationRepository.existsByPetId(pet.getId())) {
				petService.delete(userId, pet.getId());
			}
		}
		petGuardianRepository.deleteAllByUserId(userId);
		favoriteRepository.deleteAllByUserId(userId);
		waitlistRepository.deleteAllByUserId(userId);
		notificationRepository.deleteAllByUserId(userId);
		notificationPreferenceRepository.deleteAllByUserId(userId);
		refreshTokenRepository.deleteByUserId(userId);
		passwordResetTokenRepository.deleteAllByUserId(userId);

		user.withdraw(passwordEncoder.encode(UUID.randomUUID().toString()));
	}
}
