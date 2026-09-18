package com.petcare.domain.pet.dto;

import com.petcare.domain.pet.HealthRecordType;
import java.util.List;
import java.util.Map;

public record HealthRecordSummaryResponse(
		List<WeightPoint> weightHistory, Double latestWeight, Map<HealthRecordType, Long> countByType) {
}
