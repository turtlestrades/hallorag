package com.hallorag.service;

import com.hallorag.config.RagProperties;
import com.hallorag.model.ChatRequest;
import com.hallorag.model.ChatResponse;
import com.hallorag.model.DocumentChunkInfo;
import com.hallorag.model.SearchRequestDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final RagProperties ragProperties;

    public RagService(VectorStore vectorStore, ChatModel chatModel, RagProperties ragProperties) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.ragProperties = ragProperties;
    }

    public ChatResponse chat(ChatRequest request) {
        long startTime = System.currentTimeMillis();

        int topK = (request.topK() != null && request.topK() > 0)
                ? request.topK()
                : ragProperties.getDefaultTopK();

        double threshold = (request.similarityThreshold() != null && request.similarityThreshold() >= 0)
                ? request.similarityThreshold()
                : ragProperties.getDefaultSimilarityThreshold();

        double temperature = (request.temperature() != null && request.temperature() >= 0)
                ? request.temperature()
                : 0.2;

        log.info("Processing RAG query: '{}' with topK={}, threshold={}, temp={}",
                request.message(), topK, threshold, temperature);

        // 1. Vector similarity search in pgvector
        SearchRequest searchRequest = SearchRequest.builder()
                .query(request.message())
                .topK(topK)
                .similarityThreshold(threshold)
                .build();

        List<Document> similarDocuments = vectorStore.similaritySearch(searchRequest);
        List<DocumentChunkInfo> sourceChunks = mapToChunkInfo(similarDocuments);

        // 2. If no context found, handle gracefully
        if (similarDocuments.isEmpty()) {
            long executionTime = System.currentTimeMillis() - startTime;
            return new ChatResponse(
                    "I searched the knowledge base, but couldn't find any documents relevant to your query with the current similarity threshold (" 
                    + threshold + "). Please try uploading relevant documents or lowering the similarity threshold in Settings.",
                    Collections.emptyList(),
                    0,
                    executionTime
            );
        }

        // 3. Assemble context from retrieved chunks
        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < similarDocuments.size(); i++) {
            Document doc = similarDocuments.get(i);
            String filename = (String) doc.getMetadata().getOrDefault("filename", "Document " + (i + 1));
            Object chunkIdx = doc.getMetadata().getOrDefault("chunk_index", (i + 1));
            Double score = doc.getScore();
            String scoreStr = (score != null) ? String.format(Locale.ROOT, " (Confidence: %.2f%%)", score * 100) : "";

            contextBuilder.append(String.format("### Source [%d]: %s, Chunk #%s%s\n", i + 1, filename, chunkIdx, scoreStr));
            contextBuilder.append(doc.getText().strip()).append("\n\n");
        }

        // 4. Construct prompt
        String systemInstruction = (request.systemPrompt() != null && !request.systemPrompt().isBlank())
                ? request.systemPrompt()
                : """
                  You are an expert AI knowledge assistant powered by a RAG system.
                  Your task is to answer the user's question accurately and thoroughly based ONLY on the provided context information.
                  
                  Key Instructions:
                  1. Rely strictly on facts mentioned in the context. If the context does not contain enough info, admit that clearly.
                  2. Whenever citing information, reference the specific source (e.g. [Source 1] or the filename).
                  3. Format your response cleanly using Markdown with bullet points or sections where appropriate.
                  """;

        PromptTemplate template = new PromptTemplate("""
                {systemPrompt}

                -----------------------------------------
                RETRIEVED CONTEXT FROM KNOWLEDGE BASE:
                -----------------------------------------
                {context}
                -----------------------------------------

                USER QUESTION:
                {question}

                ANSWER:
                """);

        Map<String, Object> promptVars = new HashMap<>();
        promptVars.put("systemPrompt", systemInstruction);
        promptVars.put("context", contextBuilder.toString());
        promptVars.put("question", request.message());

        Prompt prompt = template.create(
                promptVars,
                ChatOptions.builder().temperature(temperature).build()
        );

        // 5. Invoke LLM
        org.springframework.ai.chat.model.ChatResponse chatResponse = chatModel.call(prompt);
        String answer = chatResponse.getResult().getOutput().getText();

        long executionTime = System.currentTimeMillis() - startTime;
        log.info("RAG query completed in {}ms with {} sources", executionTime, sourceChunks.size());

        return new ChatResponse(answer, sourceChunks, sourceChunks.size(), executionTime);
    }

    public List<DocumentChunkInfo> searchDirectly(SearchRequestDto dto) {
        int topK = (dto.topK() != null && dto.topK() > 0) ? dto.topK() : ragProperties.getDefaultTopK();
        double threshold = (dto.similarityThreshold() != null && dto.similarityThreshold() >= 0)
                ? dto.similarityThreshold()
                : 0.0; // Return all nearest up to topK

        SearchRequest searchRequest = SearchRequest.builder()
                .query(dto.query())
                .topK(topK)
                .similarityThreshold(threshold)
                .build();

        List<Document> documents = vectorStore.similaritySearch(searchRequest);
        return mapToChunkInfo(documents);
    }

    private List<DocumentChunkInfo> mapToChunkInfo(List<Document> docs) {
        List<DocumentChunkInfo> chunkInfos = new ArrayList<>();
        for (Document doc : docs) {
            String docId = (String) doc.getMetadata().getOrDefault("document_id", "");
            String filename = (String) doc.getMetadata().getOrDefault("filename", "Unknown Document");
            int chunkIdx = 1;
            Object idxObj = doc.getMetadata().get("chunk_index");
            if (idxObj instanceof Number num) {
                chunkIdx = num.intValue();
            }

            Double score = doc.getScore();
            chunkInfos.add(new DocumentChunkInfo(docId, filename, chunkIdx, score, doc.getText()));
        }
        return chunkInfos;
    }
}

