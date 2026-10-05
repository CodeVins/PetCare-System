package com.petcare.domain.hospital;

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
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "hospital_id"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "hospital_id", nullable = false)
	private Hospital hospital;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false)
	private int rating;

	@Column(nullable = false)
	private String content;

	@Column(nullable = false)
	private boolean hidden;

	public static final int MAX_IMAGES = 3;

	// 리뷰 사진 URL(업로드 순) — 별도 엔티티 없이 값 컬렉션, 리뷰를 지우면 행도 같이 지워짐
	@ElementCollection
	@CollectionTable(name = "review_image", joinColumns = @JoinColumn(name = "review_id"))
	@OrderColumn(name = "sort_order")
	@Column(name = "image_url", nullable = false)
	private List<String> imageUrls = new ArrayList<>();

	@Builder
	private Review(Hospital hospital, User user, int rating, String content) {
		this.hospital = hospital;
		this.user = user;
		this.rating = rating;
		this.content = content;
		this.hidden = false;
	}

	public boolean isOwnedBy(Long userId) {
		return this.user.getId().equals(userId);
	}

	public void update(int rating, String content) {
		this.rating = rating;
		this.content = content;
	}

	public boolean canAddImage() {
		return imageUrls.size() < MAX_IMAGES;
	}

	public void addImage(String imageUrl) {
		imageUrls.add(imageUrl);
	}

	public boolean removeImage(String imageUrl) {
		return imageUrls.remove(imageUrl);
	}

	public void hide() {
		this.hidden = true;
	}

	public void unhide() {
		this.hidden = false;
	}
}
