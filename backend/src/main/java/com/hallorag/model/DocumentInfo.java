package com.hallorag.model;

import java.time.Instant;

public record DocumentInfo(
        String id,
        String filename,
        String contentType,
        long fileSize,
        int chunkCount,
        Instant uploadedAt
) {}

