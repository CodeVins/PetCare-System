package com.petcare.domain.hospital;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

	boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

	Optional<Favorite> findByUserIdAndHospitalId(Long userId, Long hospitalId);

	Page<Favorite> findAllByUserId(Long userId, Pageable pageable);

	List<Favorite> findAllByHospitalId(Long hospitalId);
}
