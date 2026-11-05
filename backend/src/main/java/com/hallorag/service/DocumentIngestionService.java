package com.hallorag.service;

import com.hallorag.config.RagProperties;
import com.hallorag.model.DocumentInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Service
public class DocumentIngestionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);

    private final VectorStore vectorStore;
    private final JdbcClient jdbcClient;
    private final RagProperties ragProperties;

    public DocumentIngestionService(VectorStore vectorStore, JdbcClient jdbcClient, RagProperties ragProperties) {
        this.vectorStore = vectorStore;
        this.jdbcClient = jdbcClient;
        this.ragProperties = ragProperties;
    }

    @Transactional
    public DocumentInfo ingestDocument(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "uploaded_doc_" + System.currentTimeMillis();
        }

        String documentId = UUID.randomUUID().toString();
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        long fileSize = file.getSize();

        log.info("Starting ingestion for file: {}, size: {} bytes, ID: {}", originalFilename, fileSize, documentId);

        // 1. Extract text from document using Tika with fallback
        List<Document> rawDocs;
        try {
            ByteArrayResource resource = new ByteArrayResource(file.getBytes(), originalFilename);
            TikaDocumentReader tikaReader = new TikaDocumentReader(resource);
            rawDocs = tikaReader.get();
        } catch (Exception e) {
            log.warn("Tika parser encountered an issue, falling back to UTF-8 plain text reader: {}", e.getMessage());
            String fallbackContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            rawDocs = List.of(new Document(fallbackContent));
        }

        // If rawDocs is empty or has blank text, try direct string conversion
        if (rawDocs.isEmpty() || rawDocs.stream().allMatch(d -> d.getText() == null || d.getText().isBlank())) {
            String fallbackContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            if (!fallbackContent.isBlank()) {
                rawDocs = List.of(new Document(fallbackContent));
            }
        }

        if (rawDocs.isEmpty()) {
            throw new IllegalArgumentException("Could not extract any readable text from the uploaded document.");
        }

        // 2. Split document into chunks
        TokenTextSplitter splitter = TokenTextSplitter.builder()
                .withChunkSize(ragProperties.getChunkSize())
                .withMinChunkSizeChars(ragProperties.getMinChunkSizeChars())
                .build();

        List<Document> chunkedDocs = new ArrayList<>();
        int chunkSequence = 0;

        for (Document rawDoc : rawDocs) {
            String text = rawDoc.getText();
            if (text == null || text.isBlank()) {
                continue;
            }

            List<Document> chunks = splitter.apply(List.of(rawDoc));
            for (Document chunk : chunks) {
                if (chunk.getText() == null || chunk.getText().isBlank()) {
                    continue;
                }
                chunkSequence++;

                Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
                metadata.put("document_id", documentId);
                metadata.put("filename", originalFilename);
                metadata.put("content_type", contentType);
                metadata.put("chunk_index", chunkSequence);

                Document enrichedChunk = Document.builder()
                        .text(chunk.getText())
                        .metadata(metadata)
                        .build();

                chunkedDocs.add(enrichedChunk);
            }
        }

        if (chunkedDocs.isEmpty()) {
            throw new IllegalArgumentException("Document contains no valid text chunks to index.");
        }

        log.info("Adding {} chunks to pgvector store for document ID {}", chunkedDocs.size(), documentId);
        vectorStore.add(chunkedDocs);

        // 3. Save document record in PostgreSQL
        Instant now = Instant.now();
        jdbcClient.sql("""
                INSERT INTO rag_documents (id, filename, content_type, file_size, chunk_count, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """)
                .params(documentId, originalFilename, contentType, fileSize, chunkedDocs.size(), Timestamp.from(now))
                .update();

        log.info("Successfully ingested document: {} with {} chunks", originalFilename, chunkedDocs.size());

        return new DocumentInfo(documentId, originalFilename, contentType, fileSize, chunkedDocs.size(), now);
    }

    public List<DocumentInfo> listDocuments() {
        return jdbcClient.sql("""
                SELECT id, filename, content_type, file_size, chunk_count, uploaded_at
                FROM rag_documents
                ORDER BY uploaded_at DESC
                """)
                .query((rs, rowNum) -> new DocumentInfo(
                        rs.getString("id"),
                        rs.getString("filename"),
                        rs.getString("content_type"),
                        rs.getLong("file_size"),
                        rs.getInt("chunk_count"),
                        rs.getTimestamp("uploaded_at").toInstant()
                ))
                .list();
    }

    @Transactional
    public boolean deleteDocument(String documentId) {
        log.info("Deleting document and associated vectors for ID: {}", documentId);
        
        // Delete vectors matching metadata->>'document_id'
        try {
            jdbcClient.sql("DELETE FROM vector_store WHERE metadata->>'document_id' = ?")
                    .param(documentId)
                    .update();
        } catch (Exception e) {
            log.warn("Vector store cleanup by document_id failed: {}", e.getMessage());
        }

        int rows = jdbcClient.sql("DELETE FROM rag_documents WHERE id = ?")
                .param(documentId)
                .update();

        return rows > 0;
    }

    @Transactional
    public void clearAll() {
        log.info("Clearing all indexed documents and vector store data");
        try {
            jdbcClient.sql("DELETE FROM vector_store").update();
        } catch (Exception e) {
            log.warn("Could not delete from vector_store: {}", e.getMessage());
        }
        jdbcClient.sql("DELETE FROM rag_documents").update();
    }
}

