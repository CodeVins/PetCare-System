package com.petcare.domain.pet.dto;

public record FeedingCalculatorResponse(
		double rer,
		double derCoefficient,
		double dailyCalories,
		double foodCalorieDensityPer100g,
		double foodAmountGrams,
		String disclaimer
) {
}
