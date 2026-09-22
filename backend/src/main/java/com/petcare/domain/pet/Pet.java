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

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, columnDefinition = "varchar(10)")
	private PetSpecies species;

	private String breed;

	@Column(name = "birth_date")
	private LocalDate birthDate;

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "varchar(20)")
	private PetSize size;

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "varchar(10)")
	private PetSex sex;

	private Boolean neutered;

	@Column(name = "image_url")
	private String imageUrl;

	@Builder
	private Pet(
			User user, String name, PetSpecies species, String breed, LocalDate birthDate, PetSize size, PetSex sex,
			Boolean neutered) {
		this.user = user;
		this.name = name;
		this.species = species;
		this.breed = breed;
		this.birthDate = birthDate;
		this.size = size;
		this.sex = sex;
		this.neutered = neutered;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	public void update(
			String name, PetSpecies species, String breed, LocalDate birthDate, PetSize size, PetSex sex,
			Boolean neutered) {
		this.name = name;
		this.species = species;
		this.breed = breed;
		this.birthDate = birthDate;
		this.size = size;
		this.sex = sex;
		this.neutered = neutered;
	}

	public void changeImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}
}
