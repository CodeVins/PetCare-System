package com.petcare.domain.pet;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {

	List<Pet> findAllByUserId(Long userId);
}
