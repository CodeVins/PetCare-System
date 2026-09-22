package com.petcare.domain.pet;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PetRepository extends JpaRepository<Pet, Long> {

	Page<Pet> findAllByUserId(Long userId, Pageable pageable);

	long countByUserId(Long userId);

	@Query("select p from Pet p where p.user.id = :userId "
			+ "or exists (select 1 from PetGuardian g where g.pet = p and g.user.id = :userId)")
	Page<Pet> findAllAccessibleByUserId(@Param("userId") Long userId, Pageable pageable);
}
