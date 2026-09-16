package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class FavoriteController {

	private final FavoriteService favoriteService;

	@PostMapping("/api/hospitals/{hospitalId}/favorites")
	public ResponseEntity<ApiResponse<Void>> add(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId) {
		favoriteService.add(userDetails.getUser().getId(), hospitalId);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success());
	}

	@DeleteMapping("/api/hospitals/{hospitalId}/favorites")
	public ResponseEntity<ApiResponse<Void>> remove(
			@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long hospitalId) {
		favoriteService.remove(userDetails.getUser().getId(), hospitalId);
		return ResponseEntity.ok(ApiResponse.success());
	}

	@GetMapping("/api/favorites")
	public ResponseEntity<ApiResponse<List<HospitalResponse>>> getMyFavorites(
			@AuthenticationPrincipal CustomUserDetails userDetails) {
		return ResponseEntity.ok(ApiResponse.success(favoriteService.getMyFavorites(userDetails.getUser().getId())));
	}
}
