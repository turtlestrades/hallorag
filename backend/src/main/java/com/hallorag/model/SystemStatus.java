package com.hallorag.model;

public record SystemStatus(
        boolean postgresConnected,
        boolean ollamaConnected,
        long documentCount,
        long vectorChunkCount,
        String chatModel,
        String embeddingModel,
        String statusMessage
) {}

