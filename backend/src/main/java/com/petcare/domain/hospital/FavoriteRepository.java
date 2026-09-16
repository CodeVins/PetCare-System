package com.petcare.domain.hospital;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

	boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

	Optional<Favorite> findByUserIdAndHospitalId(Long userId, Long hospitalId);

	@Query("select f from Favorite f join fetch f.hospital where f.user.id = :userId")
	List<Favorite> findAllByUserIdWithHospital(@Param("userId") Long userId);
}
