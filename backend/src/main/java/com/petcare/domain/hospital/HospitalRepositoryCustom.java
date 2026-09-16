package com.petcare.domain.hospital;

import java.util.List;

public interface HospitalRepositoryCustom {

	List<HospitalSearchResult> search(String keyword, Double minRating, HospitalSortType sort);
}
