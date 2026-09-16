package com.petcare.domain.pet;

import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pet extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private String name;

	private String breed;

	@Column(name = "birth_date")
	private LocalDate birthDate;

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "varchar(20)")
	private PetSize size;

	@Column(name = "image_url")
	private String imageUrl;

	@Builder
	private Pet(User user, String name, String breed, LocalDate birthDate, PetSize size) {
		this.user = user;
		this.name = name;
		this.breed = breed;
		this.birthDate = birthDate;
		this.size = size;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	public void update(String name, String breed, LocalDate birthDate, PetSize size) {
		this.name = name;
		this.breed = breed;
		this.birthDate = birthDate;
		this.size = size;
	}

	public void changeImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}
}
