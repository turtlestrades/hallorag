package com.hallorag.service;

import com.hallorag.model.SystemStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class SystemHealthService {

    private static final Logger log = LoggerFactory.getLogger(SystemHealthService.class);

    private final JdbcClient jdbcClient;
    private final RestClient restClient;

    @Value("${spring.ai.ollama.base-url:http://host.docker.internal:11434}")
    private String ollamaBaseUrl;

    @Value("${spring.ai.ollama.chat.options.model:llama3.2:3b}")
    private String chatModel;

    @Value("${spring.ai.ollama.embedding.options.model:nomic-embed-text}")
    private String embeddingModel;

    public SystemHealthService(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
        this.restClient = RestClient.builder().build();
    }

    public SystemStatus getStatus() {
        boolean postgresOk = false;
        long docCount = 0;
        long chunkCount = 0;

        try {
            Integer docs = jdbcClient.sql("SELECT count(*) FROM rag_documents").query(Integer.class).single();
            docCount = docs != null ? docs : 0;
            
            try {
                Integer chunks = jdbcClient.sql("SELECT count(*) FROM vector_store").query(Integer.class).single();
                chunkCount = chunks != null ? chunks : 0;
            } catch (Exception e) {
                log.debug("vector_store table not yet created or empty: {}", e.getMessage());
            }

            postgresOk = true;
        } catch (Exception e) {
            log.warn("Postgres health check failed: {}", e.getMessage());
        }

        boolean ollamaOk = false;
        try {
            String tagsResponse = restClient.get()
                    .uri(ollamaBaseUrl + "/api/tags")
                    .retrieve()
                    .body(String.class);
            ollamaOk = tagsResponse != null && tagsResponse.contains("models");
        } catch (Exception e) {
            log.warn("Ollama health check failed: {}", e.getMessage());
        }

        String statusMsg;
        if (postgresOk && ollamaOk) {
            statusMsg = "System fully operational. Ready for RAG queries and document indexing.";
        } else if (!postgresOk && !ollamaOk) {
            statusMsg = "Both PostgreSQL and Ollama are unreachable.";
        } else if (!postgresOk) {
            statusMsg = "PostgreSQL is unreachable. Please verify database container.";
        } else {
            statusMsg = "Ollama is unreachable. Models may still be downloading.";
        }

        return new SystemStatus(
                postgresOk,
                ollamaOk,
                docCount,
                chunkCount,
                chatModel,
                embeddingModel,
                statusMsg
        );
    }
}
