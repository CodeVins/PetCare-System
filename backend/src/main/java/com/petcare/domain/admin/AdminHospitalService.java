package com.petcare.domain.admin;

import com.petcare.domain.hospital.Hospital;
import com.petcare.domain.hospital.HospitalRepository;
import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminHospitalService {

	private final HospitalRepository hospitalRepository;
	private final UserRepository userRepository;

	@Transactional
	public void updateOwner(Long hospitalId, Long ownerId) {
		Hospital hospital = hospitalRepository.findById(hospitalId)
				.orElseThrow(() -> new NotFoundException("병원을 찾을 수 없습니다."));
		User owner = userRepository.findById(ownerId)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

		hospital.changeOwner(owner);
		if (owner.getRole() == Role.USER) {
			owner.changeRole(Role.HOSPITAL_OWNER);
		}
	}
}
