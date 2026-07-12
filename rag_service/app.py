"""
app.py — CareerMitra AI RAG Microservice

FastAPI service that:
  1. Loads the FAISS vector index built by ingest.py
  2. Exposes POST /retrieve — takes a student query string and
     returns the top-k most relevant document chunks with metadata
  3. Exposes GET /health — liveness and index status

Port: 5001 (Express backend runs on 5000)

Start with:
    python rag_service/app.py
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# ── Suppress TF noise before any import that might pull torch/transformers ──
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# ── Path setup ────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
INDEX_DIR = Path(__file__).parent / "faiss_index"

EMBED_MODEL  = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
RAG_PORT     = int(os.getenv("RAG_PORT", "5001"))
TOP_K        = int(os.getenv("RAG_TOP_K", "5"))
SCORE_THRESH = float(os.getenv("RAG_SCORE_THRESH", "0.30"))

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("rag_service")

# ── LangChain imports (community embeddings avoids tensorflow import chain) ──
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# ── Global state ──────────────────────────────────────────────────────────────
_vector_store: FAISS | None = None
_embeddings: HuggingFaceEmbeddings | None = None


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan — loads index once at startup
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _vector_store, _embeddings
    log.info("Loading embedding model: %s", EMBED_MODEL)
    _embeddings = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    if INDEX_DIR.exists():
        log.info("Loading FAISS index from %s", INDEX_DIR)
        _vector_store = FAISS.load_local(
            str(INDEX_DIR),
            _embeddings,
            allow_dangerous_deserialization=True,
        )
        log.info("FAISS index loaded — %d vectors", _vector_store.index.ntotal)
    else:
        log.warning(
            "FAISS index not found at %s. Run: python rag_service/ingest.py", INDEX_DIR
        )

    yield  # server runs here

    log.info("Shutting down RAG service")


# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CareerMitra AI — RAG Service",
    description="Retrieval-Augmented Generation sidecar for the CareerMitra AI backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # sidecar is localhost-only; wildcard is safe here
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────

class RetrieveRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000,
                       description="Query string derived from student profile")
    top_k: int = Field(default=5, ge=1, le=15,
                       description="Number of chunks to retrieve")
    score_threshold: float = Field(default=0.30, ge=0.0, le=1.0,
                                   description="Minimum cosine similarity score")


class ChunkResult(BaseModel):
    content: str
    source_file: str
    source_path: str
    doc_type: str
    score: float


class RetrieveResponse(BaseModel):
    query: str
    chunks: list[ChunkResult]
    total_found: int
    index_size: int


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def root():
    """Human-readable status page at http://localhost:5001/"""
    index_ready = _vector_store is not None
    index_size  = _vector_store.index.ntotal if index_ready else 0
    status_color  = "#15803d" if index_ready else "#b45309"
    status_label  = "READY" if index_ready else "INDEX NOT LOADED"
    status_detail = (
        f"{index_size} vectors in FAISS index"
        if index_ready else
        "Run <code>python rag_service/ingest.py</code> to build the index"
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CareerMitra AI — RAG Service</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:-apple-system,"Segoe UI",system-ui,sans-serif;background:#f7f8fa;color:#1f2328;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}}
    .card{{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px 40px;max-width:520px;width:100%;box-shadow:0 1px 4px rgba(0,0,0,.06)}}
    .logo{{font-size:22px;font-weight:800;margin-bottom:4px}}
    .logo span{{color:#2563eb}}
    .sub{{font-size:13px;color:#57606a;margin-bottom:24px}}
    .badge{{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:{status_color}22;color:{status_color};margin-bottom:20px}}
    .detail{{font-size:13px;color:#57606a;margin-bottom:24px}}
    table{{width:100%;border-collapse:collapse;font-size:13px}}
    th{{text-align:left;padding:7px 10px;background:#f7f8fa;border:1px solid #e5e7eb;color:#57606a;font-size:11px;text-transform:uppercase;letter-spacing:.04em}}
    td{{padding:8px 10px;border:1px solid #e5e7eb;font-family:ui-monospace,Consolas,monospace;font-size:12px}}
    td.label{{font-family:inherit;font-size:13px;color:#1f2328;font-weight:500}}
    .link{{color:#2563eb;text-decoration:none}}
    .footer{{margin-top:20px;font-size:11px;color:#aaa;text-align:center}}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">Career<span>Mitra</span> <span style="font-size:11px;color:#7c3aed;font-weight:700">AI</span></div>
  <div class="sub">RAG Microservice &nbsp;·&nbsp; Port {RAG_PORT}</div>
  <div class="badge">● &nbsp;{status_label}</div>
  <div class="detail">{status_detail}</div>
  <table>
    <thead><tr><th>Endpoint</th><th>Method</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td class="label"><a class="link" href="/health">/health</a></td><td>GET</td><td>Liveness + index status</td></tr>
      <tr><td class="label">/retrieve</td><td>POST</td><td>Retrieve top-k relevant chunks</td></tr>
      <tr><td class="label"><a class="link" href="/docs">/docs</a></td><td>GET</td><td>Interactive Swagger UI</td></tr>
      <tr><td class="label"><a class="link" href="/redoc">/redoc</a></td><td>GET</td><td>ReDoc API reference</td></tr>
    </tbody>
  </table>
  <div class="footer">Called internally by the Express backend on port 5000 &nbsp;·&nbsp; Not a public endpoint</div>
</div>
</body>
</html>"""


@app.get("/health")
def health():
    index_ready = _vector_store is not None
    return {
        "status": "ok",
        "index_ready": index_ready,
        "index_size": _vector_store.index.ntotal if index_ready else 0,
        "embed_model": EMBED_MODEL,
        "index_dir": str(INDEX_DIR),
    }


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve(req: RetrieveRequest):
    if _vector_store is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "FAISS index not loaded. "
                "Run 'python rag_service/ingest.py' to build the index first."
            ),
        )

    # Similarity search with scores — returns list of (Document, float) tuples
    # score is cosine similarity (0 = unrelated, 1 = identical)
    results = _vector_store.similarity_search_with_relevance_scores(
        req.query,
        k=req.top_k,
    )

    # Filter by threshold
    filtered = [
        (doc, score)
        for doc, score in results
        if score >= req.score_threshold
    ]

    chunks = [
        ChunkResult(
            content=doc.page_content,
            source_file=doc.metadata.get("source_file", "unknown"),
            source_path=doc.metadata.get("source_path", ""),
            doc_type=doc.metadata.get("doc_type", ""),
            score=round(float(score), 4),
        )
        for doc, score in filtered
    ]

    log.info(
        "Query '%s…' → %d/%d chunks passed threshold %.2f",
        req.query[:60],
        len(chunks),
        len(results),
        req.score_threshold,
    )

    return RetrieveResponse(
        query=req.query,
        chunks=chunks,
        total_found=len(chunks),
        index_size=_vector_store.index.ntotal,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=RAG_PORT,
        app_dir=str(Path(__file__).parent),
        log_level="info",
    )
