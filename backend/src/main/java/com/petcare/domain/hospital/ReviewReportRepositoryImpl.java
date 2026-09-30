package com.petcare.domain.hospital;

import static com.petcare.domain.hospital.QReview.review;
import static com.petcare.domain.hospital.QReviewReport.reviewReport;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@RequiredArgsConstructor
public class ReviewReportRepositoryImpl implements ReviewReportRepositoryCustom {

	private final JPAQueryFactory queryFactory;

	@Override
	public Page<ReviewReport> searchForManager(ReviewSearchCondition c, Pageable pageable) {
		BooleanExpression[] where = {
				c.managerId() == null ? null : review.hospital.owner.id.eq(c.managerId()),
				c.hospitalId() == null ? null : review.hospital.id.eq(c.hospitalId()),
				isBlank(c.author()) ? null : review.user.email.containsIgnoreCase(c.author().trim()),
				isBlank(c.reporter()) ? null : reviewReport.reporter.email.containsIgnoreCase(c.reporter().trim()),
				c.from() == null ? null : reviewReport.createdAt.goe(c.from().atStartOfDay()),
				c.to() == null ? null : reviewReport.createdAt.lt(c.to().plusDays(1).atStartOfDay()),
				c.hidden() == null ? null : review.hidden.eq(c.hidden())};

		// 신고 목록은 신고일 정렬만 의미가 있어서 createdAt 방향만 받는다 (기본 최신순)
		Sort.Order order = pageable.getSort().getOrderFor("createdAt");
		boolean ascending = order != null && order.isAscending();

		// review.hospital.owner 처럼 3단계 경로는 Q타입 기본 초기화 깊이(2)를 넘어서 review를 별칭으로 조인해서 씀
		List<ReviewReport> content = queryFactory.selectFrom(reviewReport)
				.join(reviewReport.review, review)
				.where(where)
				.orderBy(ascending ? reviewReport.createdAt.asc() : reviewReport.createdAt.desc(),
						ascending ? reviewReport.id.asc() : reviewReport.id.desc())
				.offset(pageable.getOffset())
				.limit(pageable.getPageSize())
				.fetch();
		Long total = queryFactory.select(reviewReport.count()).from(reviewReport)
				.join(reviewReport.review, review)
				.where(where)
				.fetchOne();
		return new PageImpl<>(content, pageable, total == null ? 0 : total);
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
