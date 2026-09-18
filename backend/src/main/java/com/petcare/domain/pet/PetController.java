package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.PetCreateRequest;
import com.petcare.domain.pet.dto.PetResponse;
import com.petcare.domain.pet.dto.PetUpdateRequest;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.common.PageResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

	private final PetService petService;

	@PostMapping
	public ResponseEntity<ApiResponse<PetResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @Valid @RequestBody PetCreateRequest request) {
		PetResponse response = petService.create(userDetails.getUser().getId(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<PetResponse>>> getMyPets(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success(petService.getMyPets(userDetails.getUser().getId(), pageable)));
	}

	@GetMapping("/{petId}")
	public ResponseEntity<ApiResponse<PetResponse>> get(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		return ResponseEntity.ok(ApiResponse.success(petService.get(userDetails.getUser().getId(), petId)));
	}

	@PatchMapping("/{petId}")
	public ResponseEntity<ApiResponse<PetResponse>> update(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@Valid @RequestBody PetUpdateRequest request) {
		return ResponseEntity.ok(ApiResponse.success(petService.update(userDetails.getUser().getId(), petId, request)));
	}

	@DeleteMapping("/{petId}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		petService.delete(userDetails.getUser().getId(), petId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PostMapping("/{petId}/image")
	public ResponseEntity<ApiResponse<PetResponse>> uploadImage(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@RequestParam("file") MultipartFile file) {
		PetResponse response = petService.uploadImage(userDetails.getUser().getId(), petId, file);
		return ResponseEntity.ok(ApiResponse.success(response));
	}

	@DeleteMapping("/{petId}/image")
	public ResponseEntity<ApiResponse<Void>> deleteImage(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		petService.deleteImage(userDetails.getUser().getId(), petId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
