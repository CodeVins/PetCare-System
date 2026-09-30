package com.petcare.domain.hospital;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewReportRepositoryCustom {

	Page<ReviewReport> searchForManager(ReviewSearchCondition condition, Pageable pageable);
}
