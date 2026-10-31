package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.CalendarEventResponse;
import com.petcare.global.common.ApiResponse;
import com.petcare.global.security.CustomUserDetails;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class PetCalendarController {

	private final PetCalendarService petCalendarService;

	// 기간(양끝 포함, 최대 62일) 안의 일정 — 페이지네이션 없음(기간으로 이미 제한된 개인용 목록)
	@GetMapping
	public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getEvents(
			@AuthenticationPrincipal CustomUserDetails userDetails,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) Long petId) {
		return ResponseEntity.ok(ApiResponse.success(
				petCalendarService.getEvents(userDetails.getUser().getId(), petId, from, to)));
	}
}
