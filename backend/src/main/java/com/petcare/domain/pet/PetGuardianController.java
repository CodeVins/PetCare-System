package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.PetGuardianInviteRequest;
import com.petcare.domain.pet.dto.PetGuardianResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets/{petId}/guardians")
@RequiredArgsConstructor
public class PetGuardianController {

	private final PetGuardianService petGuardianService;

	@PostMapping
	public ResponseEntity<ApiResponse<PetGuardianResponse>> invite(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@Valid @RequestBody PetGuardianInviteRequest request) {
		PetGuardianResponse response = petGuardianService.invite(userDetails.getUser().getId(), petId, request.email());
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@GetMapping
	public ResponseEntity<ApiResponse<List<PetGuardianResponse>>> getGuardians(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		return ResponseEntity.ok(
				ApiResponse.success(petGuardianService.getGuardians(userDetails.getUser().getId(), petId)));
	}

	@DeleteMapping("/me")
	public ResponseEntity<ApiResponse<Void>> leave(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		petGuardianService.leave(userDetails.getUser().getId(), petId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<ApiResponse<Void>> remove(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long userId) {
		petGuardianService.remove(userDetails.getUser().getId(), petId, userId);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
