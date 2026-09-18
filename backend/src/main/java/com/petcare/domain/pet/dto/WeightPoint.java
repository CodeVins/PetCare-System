package com.petcare.domain.pet.dto;

import java.time.LocalDate;

public record WeightPoint(LocalDate recordedAt, Double weight) {
}
