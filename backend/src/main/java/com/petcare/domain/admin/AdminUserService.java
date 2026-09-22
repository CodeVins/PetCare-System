package com.petcare.domain.admin;

import com.petcare.domain.admin.dto.UserStatsResponse;
import com.petcare.domain.hospital.ReviewReplyRepository;
import com.petcare.domain.pet.PetGuardianRepository;
import com.petcare.domain.pet.PetRepository;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.ReservationStatus;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.domain.user.dto.UserResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

	private final UserRepository userRepository;
	private final ReservationRepository reservationRepository;
	private final ReviewReplyRepository reviewReplyRepository;
	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;

	public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
		return PageResponse.from(userRepository.findAll(pageable).map(UserResponse::from));
	}

	public UserStatsResponse getStats(Long userId) {
		if (!userRepository.existsById(userId)) {
			throw new NotFoundException("사용자를 찾을 수 없습니다.");
		}
		return new UserStatsResponse(
				reservationRepository.countByUserId(userId),
				reservationRepository.countByUserIdAndStatus(userId, ReservationStatus.NO_SHOW),
				reviewReplyRepository.countByAuthorId(userId),
				petRepository.countByUserId(userId),
				petGuardianRepository.countDistinctGuardiansByPetOwnerId(userId));
	}

	@Transactional
	public UserResponse updateRole(Long currentAdminId, Long targetUserId, Role role) {
		if (currentAdminId.equals(targetUserId)) {
			throw new ForbiddenException("본인의 권한은 변경할 수 없습니다.");
		}

		User user = userRepository.findById(targetUserId)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
		user.changeRole(role);
		return UserResponse.from(user);
	}

	@Transactional
	public UserResponse suspend(Long currentAdminId, Long targetUserId) {
		return changeSuspension(currentAdminId, targetUserId, true);
	}

	@Transactional
	public UserResponse activate(Long currentAdminId, Long targetUserId) {
		return changeSuspension(currentAdminId, targetUserId, false);
	}

	private UserResponse changeSuspension(Long currentAdminId, Long targetUserId, boolean suspend) {
		if (currentAdminId.equals(targetUserId)) {
			throw new ForbiddenException("본인 계정은 정지/해제할 수 없습니다.");
		}

		User user = userRepository.findById(targetUserId)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
		if (suspend) {
			user.suspend();
		} else {
			user.activate();
		}
		return UserResponse.from(user);
	}
}
