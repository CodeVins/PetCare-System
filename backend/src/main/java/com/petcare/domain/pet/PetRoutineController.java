package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.RoutineRequest;
import com.petcare.domain.pet.dto.RoutineResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets/{petId}/routines")
@RequiredArgsConstructor
public class PetRoutineController {

	private final PetRoutineService petRoutineService;

	// 펫 한 마리의 루틴 몇 개뿐이라 페이지네이션 없음
	@GetMapping
	public ResponseEntity<ApiResponse<List<RoutineResponse>>> list(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId) {
		return ResponseEntity.ok(ApiResponse.success(petRoutineService.list(userDetails.getUser().getId(), petId)));
	}

	@PostMapping
	public ResponseEntity<ApiResponse<RoutineResponse>> create(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@Valid @RequestBody RoutineRequest request) {
		RoutineResponse response = petRoutineService.create(userDetails.getUser().getId(), petId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
	}

	@PutMapping("/{routineId}")
	public ResponseEntity<ApiResponse<RoutineResponse>> update(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long routineId, @Valid @RequestBody RoutineRequest request) {
		return ResponseEntity.ok(ApiResponse.success(
				petRoutineService.update(userDetails.getUser().getId(), petId, routineId, request)));
	}

	@DeleteMapping("/{routineId}")
	public ResponseEntity<ApiResponse<Void>> delete(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long routineId) {
		petRoutineService.delete(userDetails.getUser().getId(), petId, routineId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@PostMapping("/{routineId}/checks/{date}")
	public ResponseEntity<ApiResponse<Void>> check(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long routineId, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		petRoutineService.check(userDetails.getUser().getId(), petId, routineId, date);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
	}

	@DeleteMapping("/{routineId}/checks/{date}")
	public ResponseEntity<ApiResponse<Void>> uncheck(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long petId,
			@PathVariable Long routineId, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		petRoutineService.uncheck(userDetails.getUser().getId(), petId, routineId, date);
		return ResponseEntity.ok(ApiResponse.success());
	}
}
