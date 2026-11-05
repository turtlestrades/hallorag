package com.hallorag.controller;

import com.hallorag.model.ChatRequest;
import com.hallorag.model.ChatResponse;
import com.hallorag.model.DocumentChunkInfo;
import com.hallorag.model.SearchRequestDto;
import com.hallorag.service.RagService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private final RagService ragService;

    public RagController(RagService ragService) {
        this.ragService = ragService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@Valid @RequestBody ChatRequest request) {
        try {
            ChatResponse response = ragService.chat(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate RAG response: " + e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<List<DocumentChunkInfo>> searchDirectly(@Valid @RequestBody SearchRequestDto request) {
        List<DocumentChunkInfo> results = ragService.searchDirectly(request);
        return ResponseEntity.ok(results);
    }
}

