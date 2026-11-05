package com.hallorag.model;

import jakarta.validation.constraints.NotBlank;

public record SearchRequestDto(
        @NotBlank(message = "Query must not be blank")
        String query,
        Integer topK,
        Double similarityThreshold
) {}

