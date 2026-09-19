package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.PetGuardianResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetGuardianService {

	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;
	private final UserRepository userRepository;

	@Transactional
	public PetGuardianResponse invite(Long ownerId, Long petId, String email) {
		Pet pet = getOwnedPet(ownerId, petId);

		User target = userRepository.findByEmail(email)
				.orElseThrow(() -> new NotFoundException("해당 이메일의 사용자를 찾을 수 없습니다."));
		if (pet.isOwnedBy(target.getId())) {
			throw new ConflictException("본인은 이미 이 반려동물의 소유자입니다.");
		}
		if (petGuardianRepository.existsByPetIdAndUserId(petId, target.getId())) {
			throw new ConflictException("이미 등록된 보호자입니다.");
		}

		PetGuardian guardian = PetGuardian.builder().pet(pet).user(target).build();
		return PetGuardianResponse.from(petGuardianRepository.save(guardian));
	}

	public List<PetGuardianResponse> getGuardians(Long userId, Long petId) {
		Pet pet = getAccessiblePet(userId, petId);
		return petGuardianRepository.findAllByPetId(pet.getId()).stream().map(PetGuardianResponse::from).toList();
	}

	@Transactional
	public void remove(Long ownerId, Long petId, Long targetUserId) {
		Pet pet = getOwnedPet(ownerId, petId);
		PetGuardian guardian = petGuardianRepository.findByPetIdAndUserId(pet.getId(), targetUserId)
				.orElseThrow(() -> new NotFoundException("보호자를 찾을 수 없습니다."));
		petGuardianRepository.delete(guardian);
	}

	@Transactional
	public void leave(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (pet.isOwnedBy(userId)) {
			throw new ForbiddenException("소유자는 반려동물에서 나갈 수 없습니다. 삭제를 이용해주세요.");
		}
		PetGuardian guardian = petGuardianRepository.findByPetIdAndUserId(petId, userId)
				.orElseThrow(() -> new NotFoundException("보호자를 찾을 수 없습니다."));
		petGuardianRepository.delete(guardian);
	}

	private Pet getOwnedPet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId)) {
			throw new ForbiddenException("보호자 초대/퇴출은 최초 등록자만 할 수 있습니다.");
		}
		return pet;
	}

	private Pet getAccessiblePet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId) && !petGuardianRepository.existsByPetIdAndUserId(petId, userId)) {
			throw new ForbiddenException("본인 또는 공동보호자로 등록된 반려동물만 조회할 수 있습니다.");
		}
		return pet;
	}
}
