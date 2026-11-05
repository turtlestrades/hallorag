package com.hallorag.model;

import java.util.List;

public record ChatResponse(
        String answer,
        List<DocumentChunkInfo> sources,
        int retrievedCount,
        long executionTimeMs
) {}

