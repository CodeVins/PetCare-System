package com.petcare.domain.notification;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	List<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
