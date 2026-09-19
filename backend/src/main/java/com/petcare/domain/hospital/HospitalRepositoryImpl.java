package com.petcare.domain.hospital;

import static com.petcare.domain.hospital.QHospital.hospital;
import static com.petcare.domain.hospital.QReview.review;

import com.querydsl.core.Tuple;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class HospitalRepositoryImpl implements HospitalRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public List<HospitalSearchResult> search(
			String keyword, Double minRating, HospitalSortType sort, Boolean is24Hours, Boolean hasParking) {
		List<Tuple> results = queryFactory
				.select(hospital, review.rating.avg(), review.id.count())
				.from(hospital)
				.leftJoin(review).on(review.hospital.eq(hospital), review.hidden.eq(false))
				.where(keywordContains(keyword), is24HoursCondition(is24Hours), hasParkingCondition(hasParking))
				.groupBy(hospital.id)
				.having(minRatingCondition(minRating))
				.orderBy(orderSpecifier(sort))
				.fetch();

		return results.stream()
				.map(tuple -> new HospitalSearchResult(
						tuple.get(hospital), tuple.get(review.rating.avg()), tuple.get(review.id.count())))
				.toList();
	}

	private BooleanExpression keywordContains(String keyword) {
		if (keyword == null || keyword.isBlank()) {
			return null;
		}
		return hospital.name.containsIgnoreCase(keyword).or(hospital.address.containsIgnoreCase(keyword));
	}

	private BooleanExpression is24HoursCondition(Boolean is24Hours) {
		return is24Hours == null ? null : hospital.is24Hours.eq(is24Hours);
	}

	private BooleanExpression hasParkingCondition(Boolean hasParking) {
		return hasParking == null ? null : hospital.hasParking.eq(hasParking);
	}

	private BooleanExpression minRatingCondition(Double minRating) {
		if (minRating == null) {
			return null;
		}
		return review.rating.avg().goe(minRating);
	}

	private OrderSpecifier<?> orderSpecifier(HospitalSortType sort) {
		if (sort == HospitalSortType.RATING_DESC) {
			return review.rating.avg().desc();
		}
		if (sort == HospitalSortType.REVIEW_COUNT_DESC) {
			return review.id.count().desc();
		}
		return hospital.name.asc();
	}
}
