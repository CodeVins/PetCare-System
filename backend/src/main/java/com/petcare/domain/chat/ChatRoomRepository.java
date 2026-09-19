package com.petcare.domain.chat;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

	Optional<ChatRoom> findByCustomerIdAndHospitalId(Long customerId, Long hospitalId);

	Page<ChatRoom> findAllByCustomerId(Long customerId, Pageable pageable);

	Page<ChatRoom> findAllByHospital_OwnerId(Long ownerId, Pageable pageable);
}
