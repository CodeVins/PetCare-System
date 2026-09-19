package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.PetCreateRequest;
import com.petcare.domain.pet.dto.PetResponse;
import com.petcare.domain.pet.dto.PetUpdateRequest;
import com.petcare.domain.reservation.ReservationRepository;
import com.petcare.domain.reservation.WaitlistRepository;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.ForbiddenException;
import com.petcare.global.exception.NotFoundException;
import com.petcare.global.common.PageResponse;
import com.petcare.global.file.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PetService {

	private final PetRepository petRepository;
	private final PetGuardianRepository petGuardianRepository;
	private final HealthRecordRepository healthRecordRepository;
	private final ReservationRepository reservationRepository;
	private final WaitlistRepository waitlistRepository;
	private final UserRepository userRepository;
	private final FileStorageService fileStorageService;

	@Transactional
	public PetResponse create(Long userId, PetCreateRequest request) {
		User user = userRepository.getReferenceById(userId);
		Pet pet = Pet.builder()
				.user(user)
				.name(request.name())
				.species(request.species())
				.breed(request.breed())
				.birthDate(request.birthDate())
				.size(request.size())
				.build();

		return PetResponse.of(petRepository.save(pet), PetRole.OWNER);
	}

	public PageResponse<PetResponse> getMyPets(Long userId, Pageable pageable) {
		return PageResponse.from(petRepository.findAllAccessibleByUserId(userId, pageable)
				.map(pet -> PetResponse.of(pet, roleOf(pet, userId))));
	}

	public PetResponse get(Long userId, Long petId) {
		Pet pet = getAccessiblePet(userId, petId);
		return PetResponse.of(pet, roleOf(pet, userId));
	}

	@Transactional
	public PetResponse update(Long userId, Long petId, PetUpdateRequest request) {
		Pet pet = getAccessiblePet(userId, petId);
		pet.update(request.name(), request.species(), request.breed(), request.birthDate(), request.size());
		return PetResponse.of(pet, roleOf(pet, userId));
	}

	@Transactional
	public void delete(Long userId, Long petId) {
		Pet pet = getOwnedPet(userId, petId);
		if (reservationRepository.existsByPetId(petId)) {
			throw new ConflictException("예약 이력이 있는 반려동물은 삭제할 수 없습니다.");
		}
		fileStorageService.deletePetImage(pet.getImageUrl());
		petGuardianRepository.deleteAllByPetId(petId);
		healthRecordRepository.deleteAllByPetId(petId);
		waitlistRepository.deleteAllByPetId(petId);
		petRepository.delete(pet);
	}

	@Transactional
	public PetResponse uploadImage(Long userId, Long petId, MultipartFile file) {
		Pet pet = getAccessiblePet(userId, petId);
		String previousImageUrl = pet.getImageUrl();

		String imageUrl = fileStorageService.storePetImage(file);
		pet.changeImageUrl(imageUrl);
		fileStorageService.deletePetImage(previousImageUrl);

		return PetResponse.of(pet, roleOf(pet, userId));
	}

	@Transactional
	public void deleteImage(Long userId, Long petId) {
		Pet pet = getAccessiblePet(userId, petId);
		fileStorageService.deletePetImage(pet.getImageUrl());
		pet.changeImageUrl(null);
	}

	public void verifyAccess(Long userId, Long petId) {
		getAccessiblePet(userId, petId);
	}

	private PetRole roleOf(Pet pet, Long userId) {
		return pet.isOwnedBy(userId) ? PetRole.OWNER : PetRole.GUARDIAN;
	}

	private Pet getOwnedPet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId)) {
			throw new ForbiddenException("반려동물 삭제는 최초 등록자만 할 수 있습니다.");
		}
		return pet;
	}

	private Pet getAccessiblePet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId) && !petGuardianRepository.existsByPetIdAndUserId(petId, userId)) {
			throw new ForbiddenException("본인 또는 공동보호자로 등록된 반려동물만 조회/수정할 수 있습니다.");
		}
		return pet;
	}
}
