package com.petcare.domain.user;

import com.petcare.domain.pet.HealthRecordRepository;
import com.petcare.domain.pet.dto.UpcomingVaccinationResponse;
import com.petcare.domain.user.dto.EmailUpdateRequest;
import com.petcare.domain.user.dto.PasswordChangeRequest;
import com.petcare.domain.user.dto.UserResponse;
import com.petcare.global.exception.DuplicateEmailException;
import com.petcare.global.exception.InvalidCredentialsException;
import com.petcare.global.exception.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final HealthRecordRepository healthRecordRepository;

	public UserResponse getMe(Long userId) {
		return UserResponse.from(findUser(userId));
	}

	public List<UpcomingVaccinationResponse> getUpcomingVaccinations(Long userId) {
		return healthRecordRepository
				.findAllByPet_User_IdAndNextDueDateGreaterThanEqualOrderByNextDueDateAsc(userId, LocalDate.now())
				.stream()
				.map(UpcomingVaccinationResponse::from)
				.toList();
	}

	@Transactional
	public UserResponse updateEmail(Long userId, EmailUpdateRequest request) {
		User user = findUser(userId);
		if (!user.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
			throw new DuplicateEmailException(request.email());
		}
		user.changeEmail(request.email());
		return UserResponse.from(user);
	}

	@Transactional
	public void changePassword(Long userId, PasswordChangeRequest request) {
		User user = findUser(userId);
		if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
			throw new InvalidCredentialsException();
		}
		user.changePassword(passwordEncoder.encode(request.newPassword()));
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
	}
}
