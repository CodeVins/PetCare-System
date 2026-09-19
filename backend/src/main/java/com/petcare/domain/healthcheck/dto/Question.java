package com.petcare.domain.healthcheck.dto;

import java.util.List;

public record Question(String id, String category, String text, List<QuestionOption> options) {
}
