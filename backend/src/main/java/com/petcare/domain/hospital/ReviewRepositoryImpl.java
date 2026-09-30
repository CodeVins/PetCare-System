package com.petcare.domain.hospital;

import static com.petcare.domain.hospital.QReview.review;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RequiredArgsConstructor
public class ReviewRepositoryImpl implements ReviewRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public Page<Review> searchForManager(ReviewSearchCondition c, Pageable pageable) {
		BooleanExpression[] where = {
				c.managerId() == null ? null : review.hospital.owner.id.eq(c.managerId()),
				c.hospitalId() == null ? null : review.hospital.id.eq(c.hospitalId()),
				isBlank(c.author()) ? null : review.user.email.containsIgnoreCase(c.author().trim()),
				c.from() == null ? null : review.createdAt.goe(c.from().atStartOfDay()),
				c.to() == null ? null : review.createdAt.lt(c.to().plusDays(1).atStartOfDay()),
				c.hidden() == null ? null : review.hidden.eq(c.hidden())};

		List<Review> content = queryFactory.selectFrom(review)
				.where(where)
				.orderBy(orderOf(pageable.getSort()))
				.offset(pageable.getOffset())
				.limit(pageable.getPageSize())
				.fetch();
		Long total = queryFactory.select(review.count()).from(review).where(where).fetchOne();
		return new PageImpl<>(content, pageable, total == null ? 0 : total);
	}

	// 정렬 허용 필드는 작성일/별점뿐 — 그 외 sort 값은 무시하고 최신순
	private OrderSpecifier<?>[] orderOf(Sort sort) {
		OrderSpecifier<?>[] orders = sort.stream()
				.map(o -> {
					Order dir = o.isAscending() ? Order.ASC : Order.DESC;
					return switch (o.getProperty()) {
						case "createdAt" -> new OrderSpecifier<>(dir, review.createdAt);
						case "rating" -> new OrderSpecifier<>(dir, review.rating);
						default -> null;
					};
				})
				.filter(Objects::nonNull)
				.toArray(OrderSpecifier[]::new);
		return orders.length > 0
				? append(orders, review.id.desc())
				: new OrderSpecifier<?>[] {review.createdAt.desc(), review.id.desc()};
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	private OrderSpecifier<?>[] append(OrderSpecifier<?>[] orders, OrderSpecifier<?> tieBreaker) {
		OrderSpecifier<?>[] result = Arrays.copyOf(orders, orders.length + 1);
		result[orders.length] = tieBreaker;
		return result;
	}
}
