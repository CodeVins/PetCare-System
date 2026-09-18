package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.PetCreateRequest;
import com.petcare.domain.pet.dto.PetResponse;
import com.petcare.domain.pet.dto.PetUpdateRequest;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
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
	private final UserRepository userRepository;
	private final FileStorageService fileStorageService;

	@Transactional
	public PetResponse create(Long userId, PetCreateRequest request) {
		User user = userRepository.getReferenceById(userId);
		Pet pet = Pet.builder()
				.user(user)
				.name(request.name())
				.breed(request.breed())
				.birthDate(request.birthDate())
				.size(request.size())
				.build();

		return PetResponse.from(petRepository.save(pet));
	}

	public PageResponse<PetResponse> getMyPets(Long userId, Pageable pageable) {
		return PageResponse.from(petRepository.findAllByUserId(userId, pageable).map(PetResponse::from));
	}

	public PetResponse get(Long userId, Long petId) {
		return PetResponse.from(getOwnedPet(userId, petId));
	}

	@Transactional
	public PetResponse update(Long userId, Long petId, PetUpdateRequest request) {
		Pet pet = getOwnedPet(userId, petId);
		pet.update(request.name(), request.breed(), request.birthDate(), request.size());
		return PetResponse.from(pet);
	}

	@Transactional
	public void delete(Long userId, Long petId) {
		Pet pet = getOwnedPet(userId, petId);
		fileStorageService.deletePetImage(pet.getImageUrl());
		petRepository.delete(pet);
	}

	@Transactional
	public PetResponse uploadImage(Long userId, Long petId, MultipartFile file) {
		Pet pet = getOwnedPet(userId, petId);
		String previousImageUrl = pet.getImageUrl();

		String imageUrl = fileStorageService.storePetImage(file);
		pet.changeImageUrl(imageUrl);
		fileStorageService.deletePetImage(previousImageUrl);

		return PetResponse.from(pet);
	}

	@Transactional
	public void deleteImage(Long userId, Long petId) {
		Pet pet = getOwnedPet(userId, petId);
		fileStorageService.deletePetImage(pet.getImageUrl());
		pet.changeImageUrl(null);
	}

	private Pet getOwnedPet(Long userId, Long petId) {
		Pet pet = petRepository.findById(petId)
				.orElseThrow(() -> new NotFoundException("반려동물을 찾을 수 없습니다."));
		if (!pet.isOwnedBy(userId)) {
			throw new ForbiddenException("본인의 반려동물만 조회/수정할 수 있습니다.");
		}
		return pet;
	}
}
