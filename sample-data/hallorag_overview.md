# Project HalloRAG Architecture & Specification

## Executive Summary
HalloRAG is a state-of-the-art enterprise Retrieval-Augmented Generation (RAG) platform. It couples Java 25 with Spring Boot 3.4 to deliver a scalable, observable, and fully local document intelligence service.

## Core Architectural Components

### 1. Spring Boot 3.4 Runtime on Java 25
The core microservice runs inside an Eclipse Temurin OpenJDK 25 container. It utilizes modern Java constructs including Record types for immutable DTOs, virtual threads for non-blocking I/O, and Spring AI 1.0.0-M6 for orchestration.

### 2. Vector Storage: PostgreSQL 17 with pgvector
Vector indexing uses an HNSW (Hierarchical Navigable Small World) index over Cosine Distance. 
- Schema: `vector_store` table with `content`, `metadata` JSONB, and `embedding` vector(768).
- Dimension: 768 dimensions corresponding to the nomic-embed-text embedding space.
- Query Performance: HNSW provides sub-10ms nearest neighbor search across hundreds of thousands of document chunks.

### 3. Local Model Engine: Ollama
- **Embedding Model**: `nomic-embed-text` produces dense semantic representations with an 8192 token context window.
- **Generation Model**: `llama3.2:3b` operates locally with zero outbound network calls, ensuring 100% data privacy and compliance.

### 4. Document Processing Pipeline
1. Ingestion: Documents uploaded via HTTP multipart endpoint are parsed through Apache Tika 2.9.2.
2. Chunking: Text is segmented using `TokenTextSplitter` with 400 token chunk windows and a 50 character minimum threshold.
3. Metadata Annotation: Each chunk records original document ID, filename, mime type, and sequence index.
4. Storage: High-dimensional vectors are loaded atomically into PostgreSQL.

### 5. Verification & Citations
Every assistant response produces structured citations referencing the original file name, chunk identifier, and cosine similarity confidence score.

