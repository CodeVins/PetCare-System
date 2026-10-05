package com.petcare.domain.hospital;

import com.petcare.domain.user.Role;
import com.petcare.domain.user.User;
import com.petcare.global.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
// 거리 검색의 위도 범위 조건용 (위도 범위로 인덱스 스캔 후 경도는 인덱스 안에서 거름)
@Table(indexes = @Index(name = "idx_hospital_lat_lng", columnList = "latitude, longitude"))
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

	@Column(name = "is_24_hours")
	private Boolean is24Hours;

	@Column(name = "has_parking")
	private Boolean hasParking;

	@Column(name = "avg_treatment_price")
	private Integer avgTreatmentPrice;

	@Column(name = "image_url")
	private String imageUrl;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "owner_id")
	private User owner;

	// 요일별 진료 시간(구조화) — 기존 openingHours(자유 텍스트)는 "점심시간·공휴일 휴무" 같은 안내 문구로 계속 사용
	@ElementCollection
	@CollectionTable(name = "hospital_opening_hour", joinColumns = @JoinColumn(name = "hospital_id"))
	private List<OpeningHour> weeklyHours = new ArrayList<>();

	@Builder
	private Hospital(
			String name, String address, Double latitude, Double longitude, String openingHours, String specialty,
			Boolean is24Hours, Boolean hasParking, Integer avgTreatmentPrice) {
		this.name = name;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.openingHours = openingHours;
		this.specialty = specialty;
		this.is24Hours = is24Hours;
		this.hasParking = hasParking;
		this.avgTreatmentPrice = avgTreatmentPrice;
	}

	public boolean isManagedBy(User user) {
		return user.getRole() == Role.ADMIN || (owner != null && owner.getId().equals(user.getId()));
	}

	public void changeOwner(User owner) {
		this.owner = owner;
	}

	public void changeImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public void replaceWeeklyHours(List<OpeningHour> hours) {
		weeklyHours.clear();
		weeklyHours.addAll(hours);
	}

	// 24시간이면 항상 true, 진료 시간을 등록하지 않았으면 null(알 수 없음), 아니면 그 시각을 포함하는 구간이 있는지
	public Boolean isOpenAt(LocalDateTime dateTime) {
		if (Boolean.TRUE.equals(is24Hours)) {
			return true;
		}
		if (weeklyHours.isEmpty()) {
			return null;
		}
		return weeklyHours.stream().anyMatch(hour -> hour.covers(dateTime.getDayOfWeek(), dateTime.toLocalTime()));
	}

	public void update(
			String name, String address, Double latitude, Double longitude, String openingHours, String specialty,
			Boolean is24Hours, Boolean hasParking, Integer avgTreatmentPrice) {
		this.name = name;
		this.address = address;
		this.latitude = latitude;
		this.longitude = longitude;
		this.openingHours = openingHours;
		this.specialty = specialty;
		this.is24Hours = is24Hours;
		this.hasParking = hasParking;
		this.avgTreatmentPrice = avgTreatmentPrice;
	}
}
