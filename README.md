# HalloRAG: Java 25 & Spring Boot 3.4 RAG System with pgvector

A complete, production-grade Retrieval-Augmented Generation (RAG) system built with **Spring Boot 3.4**, **Java 25**, **PostgreSQL 17 with pgvector**, **Ollama**, and a modern **React SPA**.

Everything runs entirely in Docker with **zero API keys required** — 100% self-hosted, private, and local.

---

## 🌟 Key Highlights

- **Java 25 & Spring Boot 3.4.2**: Modern Java development leveraging record classes, `JdbcClient`, and the latest Spring AI 1.0.0-M6 milestone.
- **Database Migrations with Flyway**: Automated, versioned database migrations (`V1__init_schema.sql`) for PostgreSQL extensions (`vector`, `uuid-ossp`), document metadata tables, and the `vector_store` table with HNSW index.
- **PostgreSQL 17 + pgvector**: Vector database with HNSW indexing and Cosine distance metric for high-speed semantic retrieval.
- **Self-Hosted Local AI (Ollama)**:
  - Embeddings: `nomic-embed-text` (768 dimensions, token-efficient).
  - LLM: `llama3.2:3b` (fast, lightweight, context-aware).
  - Automatic model downloading via `ollama-init` sidecar container.
- **Document Processing with Apache Tika**: Ingests PDF, Microsoft Word (`.docx`), Markdown (`.md`), plain text (`.txt`), CSV, and JSON.
- **Smart Chunking**: `TokenTextSplitter` with token-based windowing and metadata preservation (document ID, filename, chunk sequence).
- **Interactive Modern UI**:
  - Drag-and-drop document uploader with chunking statistics.
  - RAG conversational assistant with markdown formatting and latency tracking.
  - Interactive source citation drawer: expand to inspect exact text chunks and cosine similarity scores.
  - Dedicated **pgvector Similarity Search Inspector** to test semantic search directly without calling the LLM.
  - Hyperparameter settings dialog (Top-K, similarity threshold, temperature, custom system instructions).

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │     React 18 + Vite     │
                       │   UI (Port 3000 / 80)   │
                       └────────────┬────────────┘
                                    │ /api
                                    ▼
                       ┌─────────────────────────┐
                       │    Spring Boot 3.4.2    │
                       │     (OpenJDK 25)        │
                       │       Port 8080         │
                       └─────┬─────────────┬─────┘
                             │             │
                    Embeddings & SQL   Chat & Embed
                             │             │
                             ▼             ▼
       ┌────────────────────────┐       ┌────────────────────────┐
       │     PostgreSQL 17      │       │     Ollama Server      │
       │       + pgvector       │       │    (Port 11434)        │
       │    (HNSW, Cosine)      │       │ • nomic-embed-text     │
       │       Port 5432        │       │ • llama3.2:3b          │
       └────────────────────────┘       └────────────────────────┘
```

---

## 🚀 Quickstart

### 1. Ensure Models Are Pulled in Your Host Ollama

On your host machine, make sure you have the required models:

```bash
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

And ensure Ollama is listening on all network interfaces so Docker containers can reach it:
```bash
# If running manually:
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Or if running as a systemd service on Linux:
# Add Environment="OLLAMA_HOST=0.0.0.0:11434" to /etc/systemd/system/ollama.service.d/override.conf
# and run: sudo systemctl daemon-reload && sudo systemctl restart ollama
```

### 2. Start HalloRAG

Run Docker Compose from `/Users/jeet/git/hallorag`:

```bash
docker compose up --build -d
```

*(By default, this runs `postgres`, `backend`, and `frontend` using your host Ollama with native GPU speed).*

> **Tip (Fallback containerized Ollama)**: If running on a machine without host Ollama, simply add `--profile container-ollama`:
> ```bash
> docker compose --profile container-ollama up --build -d
> ```

### 4. Access the Application

- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api/system/status](http://localhost:8080/api/system/status)
- **Ollama API**: [http://localhost:11434](http://localhost:11434)
- **PostgreSQL**: `localhost:5432` (`ragdb` / `raguser` / `ragpassword`)

---

## 💡 How to Test the RAG System

1. **Open the Web UI**: Visit [http://localhost:3000](http://localhost:3000).
2. **Verify System Status**: Check the top navigation bar. Both PostgreSQL & pgvector and Ollama should show green "Connected" / "Ready" indicators.
3. **Upload Documents**: Drag and drop any file (`.pdf`, `.txt`, `.docx`, `.md`) into the Knowledge Base sidebar on the left.
   - The backend extracts text, splits it into token chunks, generates 768-dimensional vector embeddings, and stores them in PostgreSQL.
4. **Chat with Context**:
   - Ask questions like: *"Summarize the uploaded document"* or *"What are the key technical points?"*
   - The assistant answers accurately and attaches an **Interactive Source Drawer**.
   - Click each retrieved source chunk to see the exact chunk snippet, filename, chunk number, and cosine match confidence percentage.
5. **Inspect Vectors Directly**:
   - Switch to the **Vector Search Inspector** tab.
   - Type any semantic search query and slide the Top-K or Cosine threshold to see raw similarity scores and nearest chunks without invoking the LLM!
6. **Tune Hyperparameters**:
   - Click **Settings** in the navbar to adjust:
     - `Top-K`: Number of chunks sent to the LLM (1 to 10).
     - `Similarity Cutoff`: Minimum cosine similarity percentage.
     - `Temperature`: Factual grounding (0.1 - 0.3) vs creative answers.
     - `System Prompt`: Custom instructions for the RAG assistant.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload multipart document (`.pdf`, `.txt`, `.md`, `.docx`) |
| `GET` | `/api/documents` | List all indexed documents with chunk counts & metadata |
| `DELETE` | `/api/documents/{id}` | Delete a document and all its corresponding vector embeddings |
| `DELETE` | `/api/documents` | Wipe all documents and vector embeddings |
| `POST` | `/api/rag/chat` | Send question, retrieve relevant chunks, generate answer with citations |
| `POST` | `/api/rag/search` | Direct vector search returning nearest chunks & similarity scores |
| `GET` | `/api/system/status` | Health check for PostgreSQL, pgvector table rows, and Ollama models |

---

## ⚙️ Configuration & Environment Variables

You can customize variables in `.env`:

```env
# Database
DB_NAME=ragdb
DB_USER=raguser
DB_PASSWORD=ragpassword
POSTGRES_PORT=5432

# Ollama Models
OLLAMA_PORT=11434
CHAT_MODEL=llama3.2:3b
EMBEDDING_MODEL=nomic-embed-text

# Application Ports
BACKEND_PORT=8080
FRONTEND_PORT=3000
```

---

## 🛠️ Stopping the System

```bash
# Stop all containers
docker compose down

# Stop and remove persistent database and model volumes
docker compose down -v
```

