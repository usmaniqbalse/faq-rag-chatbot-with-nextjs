# RAG Chat (Next.js 14 + FastAPI + Ollama + ChromaDB)

ChatGPT-style local chat UI (**Next.js 14 App Router**) backed by a secure **FastAPI** service.  
Upload PDFs, embed with **Ollama** (`nomic-embed-text`), store in **ChromaDB**, re-rank with **CrossEncoder**, and answer via **`llama3.2:3b`** strictly from retrieved context.

> **Offline note:** First run needs internet to cache the CrossEncoder. After that, the system works fully offline (models + cache are local).

---

## ✨ Features

- PDF → text → chunks (size **400**, overlap **100**)
- Embeddings with **Ollama** (`nomic-embed-text:latest`)
- Persistent vector store via **ChromaDB** (`./demo-rag-chroma`)
- Re-ranking with `cross-encoder/ms-marco-MiniLM-L-6-v2` (top-3)
- Grounded answers from **`llama3.2:3b`** (no outside knowledge)
- Chat thread UI like ChatGPT; Q&A persisted to **localStorage**
- Secure backend with **API key** (kept server-side in Next.js API routes)
- CORS limited to allowed origins

---

## 🧱 Project Structure

```
root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                # env/settings
│   │   ├── deps.py                  # API-key dependency
│   │   ├── models.py                # pydantic DTOs
│   │   ├── routers/
│   │   │   ├── ask.py               # POST /v1/ask
│   │   │   └── ingest.py            # POST /v1/ingest
│   │   └── services/
│   │       ├── document_processing.py   # PDF -> chunks
│   │       ├── llm.py                   # call Ollama chat
│   │       ├── rerank.py                # CrossEncoder top-3
│   │       └── vector_store.py          # Chroma get/upsert/query
│   ├── main.py                     # FastAPI app + CORS
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── api/
    │   │   ├── ask/route.ts         # proxies to backend /v1/ask
    │   │   └── ingest/route.ts      # proxies to backend /v1/ingest
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx                 # Chat page
    ├── components/
    │   ├── Chat.tsx
    │   ├── Composer.tsx
    │   ├── FileUploader.tsx
    │   └── MessageList.tsx
    ├── lib/
    │   ├── storage.ts               # localStorage thread
    │   └── types.ts
    ├── next.config.js
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## ✅ Prerequisites

- **Python** 3.9–3.11
- **Node.js** 18+
- **Ollama** running at `http://localhost:11434`
- **Git**
- One-time internet to cache CrossEncoder

---

## 1) Clone the repo

```bash
git clone https://github.com/yourname/rag-chat.git
cd rag-chat
```

---

## 2) Backend — install & run

### 2.1 Create venv and install deps

```bash
cd backend
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

**`backend/requirements.txt` should include (already provided):**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.12
pydantic==2.8.2
pydantic-settings==2.4.0
chromadb==0.5.20
ollama==0.4.3
sentence-transformers==3.3.1
pymupdf==1.24.14
langchain-community==0.3.7
langchain-core>=0.3.0,<0.4.0
langchain-text-splitters>=0.3.0,<0.4.0
```

### 2.2 Configure environment

```bash
cp .env.example .env
# Edit .env:
# API_KEY=change-me
# ALLOWED_ORIGINS=http://localhost:3000
# OLLAMA_BASE_URL=http://localhost:11434
# CHROMA_PATH=./demo-rag-chroma
# EMBED_MODEL=nomic-embed-text:latest
# CHAT_MODEL=llama3.2:3b
# MAX_UPLOAD_MB=20
```

### 2.3 Start Ollama & pull models

```bash
# In a separate terminal:
ollama serve

# Pull models used by the app:
ollama pull llama3.2:3b
ollama pull nomic-embed-text:latest

# Verify API is up:
curl http://localhost:11434/api/tags
```

> If you plan to be fully offline, run once with internet so CrossEncoder can cache:
>
> ```python
> from sentence_transformers import CrossEncoder
> CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
> ```

### 2.4 Run the backend API

```bash
uvicorn main:app --reload --port 8000
```

Backend now at: **[http://localhost:8000](http://localhost:8000)**

---

## 3) Frontend — install & run (Next.js 14)

```bash
cd ../frontend
npm install
```

Create `.env.local`:

```bash
cat > .env.local <<'ENV'
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
BACKEND_URL=http://localhost:8000
BACKEND_API_KEY=change-me
ENV
```

Run the dev server:

```bash
npm run dev
```

Frontend now at: **[http://localhost:3000](http://localhost:3000)**

---

## 4) Use the app

1. Click **📄 Upload PDF** → choose a PDF → wait for “Ingested … chunks”.
2. Type your question → **Send**.
3. The assistant’s answer streams in; your Q\&A persists in **localStorage**.
4. Use **Clear chat** to reset the thread locally.

---

## 5) API Reference

> The browser talks to **Next.js API routes** (`/api/...`), which securely proxy to the Python backend with the API key server-side.

### Frontend (browser) endpoints

- **POST** `/api/ingest` — multipart form with `file: PDF`
  → Proxies to backend `/v1/ingest`
- **POST** `/api/ask` — JSON `{ "question": string }`
  → Proxies to backend `/v1/ask`

### Backend endpoints (Python)

- **POST** `/v1/ingest` — headers: `x-api-key: <API_KEY>`

  - Returns `{ message, file_name, chunks }`

- **POST** `/v1/ask` — headers: `x-api-key: <API_KEY>`

  - Returns `{ answer, retrieved, reranked_ids }`

> **Security:** The `x-api-key` is **not exposed** to the browser; Next.js attaches it server-side.

---

## 6) How it works (pipeline)

1. **Ingest**

   - PDF saved to temp file → parsed with **PyMuPDF** → split via `RecursiveCharacterTextSplitter` (400/100).
   - Embeddings computed with **Ollama** (`nomic-embed-text`) and upserted into **ChromaDB** at `./demo-rag-chroma`.

2. **Ask**

   - Chroma returns top-k (default 10) candidate chunks for the question.

3. **Re-rank**

   - `cross-encoder/ms-marco-MiniLM-L-6-v2` ranks candidates and selects **top-3**, concatenated as **context**.

4. **Answer**

   - **Ollama** runs `llama3.2:3b` with a strict system prompt to answer **only** from context.
   - Full answer is returned (simple non-streaming API); UI updates the chat thread.

---

## 7) Troubleshooting

- **Cannot connect to Ollama**

  - `ollama serve` then `curl http://localhost:11434/api/tags`
  - Ensure port **11434** is free.

- **No answer or empty retrieval**

  - Ingest a PDF first; ensure your question is covered by the document.

- **CrossEncoder fails offline on first run**

  - Run once with internet to cache the model (see snippet above).

- **Reset vector DB**

  ```bash
  # stop backend first
  rm -rf backend/demo-rag-chroma
  mkdir backend/demo-rag-chroma
  ```

- **CORS errors**

  - Ensure `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`.

---

## 8) Customize

- **Models**: edit `backend/app/config.py` (`EMBED_MODEL`, `CHAT_MODEL`).
- **Chunking**: `backend/app/services/document_processing.py`.
- **Retrieval size**: `backend/app/services/vector_store.py` (`n_results`).
- **UI styling**: Tailwind classes in `frontend/app/globals.css` + components.

---

## 9) Security Notes

- API requires `x-api-key` (checked in `deps.py`).
- Key is stored only on the **server** (`.env.local` on Next.js, `.env` on FastAPI).
- CORS restricted to `ALLOWED_ORIGINS`.
- Uploads limited to PDFs and `MAX_UPLOAD_MB`.

---

## 10) Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: FastAPI, Uvicorn, Pydantic
- **RAG**: Ollama (LLMs/embeddings), ChromaDB (vectors), Sentence-Transformers (re-rank)

---

## 11) License

MIT (replace with your preferred license)

---

## 12) Quick Commands (copy/paste)

```bash
# back end
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

```bash
# front end
cd frontend
npm install
echo 'NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
BACKEND_URL=http://localhost:8000
BACKEND_API_KEY=change-me' > .env.local
npm run dev
```

```bash
# ollama (separate terminal)
ollama serve
ollama pull llama3.2:3b
ollama pull nomic-embed-text:latest
curl http://localhost:11434/api/tags
```

Happy building! 🚀
