package com.petcare.domain.chat;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

	Optional<ChatRoom> findByCustomerIdAndHospitalId(Long customerId, Long hospitalId);

	Page<ChatRoom> findAllByCustomerId(Long customerId, Pageable pageable);

	Page<ChatRoom> findAllByHospital_OwnerId(Long ownerId, Pageable pageable);

	// WebSocket 구독 권한 검사용 — 트랜잭션 밖(STOMP 인터셉터)에서 canAccess()가 hospital을 읽으므로 같이 로딩
	@EntityGraph(attributePaths = "hospital")
	Optional<ChatRoom> findWithHospitalById(Long id);
}
