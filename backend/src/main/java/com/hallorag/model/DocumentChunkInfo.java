package com.hallorag.model;

public record DocumentChunkInfo(
        String documentId,
        String filename,
        int chunkIndex,
        Double score,
        String content
) {}

