package com.petcare.domain.chat;

import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

	Page<ChatMessage> findAllByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId, Pageable pageable);

	@Query("select max(m.id) from ChatMessage m where m.chatRoom.id = :roomId")
	Long findLatestId(@Param("roomId") Long roomId);

	// 안 읽은 메시지 수 [roomId, count] — 상대편이 보낸 메시지 중 내 쪽 마지막 읽음 id보다 큰 것. 목록 한 페이지를 쿼리 한 번으로
	@Query("select m.chatRoom.id, count(m) from ChatMessage m where m.chatRoom.id in :roomIds"
			+ " and m.sender.id <> m.chatRoom.customer.id"
			+ " and m.id > coalesce(m.chatRoom.customerLastReadMessageId, 0) group by m.chatRoom.id")
	List<Object[]> countUnreadForCustomer(@Param("roomIds") Collection<Long> roomIds);

	@Query("select m.chatRoom.id, count(m) from ChatMessage m where m.chatRoom.id in :roomIds"
			+ " and m.sender.id = m.chatRoom.customer.id"
			+ " and m.id > coalesce(m.chatRoom.hospitalLastReadMessageId, 0) group by m.chatRoom.id")
	List<Object[]> countUnreadForHospital(@Param("roomIds") Collection<Long> roomIds);
}
