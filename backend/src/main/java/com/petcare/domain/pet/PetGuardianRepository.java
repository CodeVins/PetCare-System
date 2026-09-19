package com.petcare.domain.pet;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetGuardianRepository extends JpaRepository<PetGuardian, Long> {

	boolean existsByPetIdAndUserId(Long petId, Long userId);

	List<PetGuardian> findAllByPetId(Long petId);

	Optional<PetGuardian> findByPetIdAndUserId(Long petId, Long userId);

	void deleteAllByPetId(Long petId);
}
