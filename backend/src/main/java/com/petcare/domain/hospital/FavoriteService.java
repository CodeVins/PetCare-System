package com.petcare.domain.hospital;

import com.petcare.domain.hospital.dto.HospitalResponse;
import com.petcare.domain.user.User;
import com.petcare.domain.user.UserRepository;
import com.petcare.global.common.PageResponse;
import com.petcare.global.exception.ConflictException;
import com.petcare.global.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteService {

	private final FavoriteRepository favoriteRepository;
	private final UserRepository userRepository;
	private final HospitalService hospitalService;

	@Transactional
	public void add(Long userId, Long hospitalId) {
		Hospital hospital = hospitalService.findHospital(hospitalId);
		if (favoriteRepository.existsByUserIdAndHospitalId(userId, hospitalId)) {
			throw new ConflictException("이미 즐겨찾기한 병원입니다.");
		}

		User user = userRepository.getReferenceById(userId);
		favoriteRepository.save(Favorite.builder().user(user).hospital(hospital).build());
	}

	@Transactional
	public void remove(Long userId, Long hospitalId) {
		Favorite favorite = favoriteRepository.findByUserIdAndHospitalId(userId, hospitalId)
				.orElseThrow(() -> new NotFoundException("즐겨찾기한 병원이 아닙니다."));
		favoriteRepository.delete(favorite);
	}

	public PageResponse<HospitalResponse> getMyFavorites(Long userId, Pageable pageable) {
		return PageResponse.from(favoriteRepository.findAllByUserId(userId, pageable)
				.map(favorite -> HospitalResponse.from(favorite.getHospital())));
	}
}
