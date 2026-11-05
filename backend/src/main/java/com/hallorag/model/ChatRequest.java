package com.hallorag.model;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank(message = "Message must not be blank")
        String message,
        Integer topK,
        Double similarityThreshold,
        Double temperature,
        String systemPrompt
) {}

