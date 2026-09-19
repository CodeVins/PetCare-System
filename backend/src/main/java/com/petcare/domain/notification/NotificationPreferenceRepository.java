package com.petcare.domain.notification;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

	Optional<NotificationPreference> findByUserIdAndCategory(Long userId, NotificationCategory category);

	List<NotificationPreference> findAllByUserId(Long userId);
}
