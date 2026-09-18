package com.petcare.domain.hospital;

import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Hospital extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	private String address;

	private Double latitude;

	private Double longitude;

	@Column(name = "opening_hours")
	private String openingHours;

	private String specialty;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "owner_id")
	private User owner;

	@Builder
	private Hospital(
			String name, String address, Double latitude, Double longitude, String openingHours, String specialty) {
		this.name = name;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.openingHours = openingHours;
		this.specialty = specialty;
	}

	public boolean isManagedBy(User user) {
		return user.getRole() == Role.ADMIN || (owner != null && owner.getId().equals(user.getId()));
	}

	public void changeOwner(User owner) {
		this.owner = owner;
	}

	public void update(String name, String address, Double latitude, Double longitude, String openingHours, String specialty) {
		this.name = name;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.openingHours = openingHours;
		this.specialty = specialty;
	}
}
