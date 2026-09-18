package com.petcare.domain.admin;

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

	public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
		return PageResponse.from(userRepository.findAll(pageable).map(UserResponse::from));
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
}
