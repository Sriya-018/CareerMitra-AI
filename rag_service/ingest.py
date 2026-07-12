"""
ingest.py — One-time (and on-demand) FAISS index builder

Reads all documents from the knowledge_base/ directory,
chunks them with LangChain's RecursiveCharacterTextSplitter,
embeds them with a local HuggingFace sentence-transformer model,
and persists the FAISS vector store to rag_service/faiss_index/.

Run once before starting the RAG service:
    python rag_service/ingest.py

Re-run whenever knowledge_base/ documents are updated.
"""

import os
import sys
import time
from pathlib import Path

# ── Suppress TF/oneDNN noise before any torch/transformers import ──────────
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

# ── Path setup ────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).parent.parent          # project root
KB_DIR      = ROOT / "knowledge_base"
INDEX_DIR   = Path(__file__).parent / "faiss_index"
EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# ── LangChain imports (use community embeddings — avoids langchain_huggingface
#    which triggers the tensorflow/protobuf import chain on some systems) ──────
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

SUPPORTED_EXTENSIONS = {".md", ".txt", ".pdf"}


def load_documents(kb_dir: Path) -> list:
    """Load all documents from knowledge_base directory tree."""
    documents = []
    files = list(kb_dir.rglob("*"))

    for file_path in sorted(files):
        ext = file_path.suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            continue

        try:
            if ext == ".pdf":
                loader = PyPDFLoader(str(file_path))
            elif ext in (".md",):
                # TextLoader is more reliable than UnstructuredMarkdownLoader for our plain markdown
                loader = TextLoader(str(file_path), encoding="utf-8")
            else:
                loader = TextLoader(str(file_path), encoding="utf-8")

            docs = loader.load()

            # Enrich metadata
            for doc in docs:
                doc.metadata["source_file"] = file_path.name
                doc.metadata["source_path"] = str(file_path.relative_to(ROOT))
                doc.metadata["doc_type"]    = ext.lstrip(".")

            documents.extend(docs)
            print(f"  Loaded: {file_path.name} ({len(docs)} page(s))")

        except Exception as exc:
            print(f"  WARNING: Could not load {file_path.name}: {exc}", file=sys.stderr)

    return documents


def split_documents(documents: list) -> list:
    """
    Split documents into overlapping chunks.

    Chunk size 600 chars gives ~120 tokens — fits well inside most LLM
    context windows even when 5–8 chunks are concatenated.
    Overlap 120 chars preserves context across chunk boundaries.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=120,
        length_function=len,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    print(f"\n  Split {len(documents)} document(s) into {len(chunks)} chunk(s)")
    return chunks


def build_index(chunks: list, embed_model: str, index_dir: Path) -> None:
    """Embed all chunks and persist FAISS index to disk."""
    print(f"\n  Loading embedding model: {embed_model}")
    print("  (This may take a minute the first time to download the model weights)")

    embeddings = HuggingFaceEmbeddings(
        model_name=embed_model,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    print(f"  Embedding {len(chunks)} chunks…")
    t0 = time.time()
    vector_store = FAISS.from_documents(chunks, embeddings)
    elapsed = time.time() - t0
    print(f"  Embedded in {elapsed:.1f}s")

    index_dir.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(index_dir))
    print(f"  FAISS index saved to: {index_dir}")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("CareerMitra AI — Knowledge Base Ingestion")
    print("=" * 60)

    if not KB_DIR.exists():
        print(f"ERROR: knowledge_base/ directory not found at {KB_DIR}", file=sys.stderr)
        sys.exit(1)

    print(f"\n[1/3] Loading documents from {KB_DIR}")
    documents = load_documents(KB_DIR)

    if not documents:
        print("ERROR: No documents found in knowledge_base/", file=sys.stderr)
        sys.exit(1)

    print(f"\n[2/3] Splitting into chunks")
    chunks = split_documents(documents)

    print(f"\n[3/3] Building FAISS index")
    build_index(chunks, EMBED_MODEL, INDEX_DIR)

    print("\n" + "=" * 60)
    print(f"Ingestion complete! {len(chunks)} chunks indexed.")
    print(f"Index location: {INDEX_DIR}")
    print("Start the RAG service with:")
    print("  python rag_service/app.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
