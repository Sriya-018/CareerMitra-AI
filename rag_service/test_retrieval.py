"""Quick smoke test for the FAISS retrieval pipeline."""
import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

INDEX_DIR = Path('rag_service/faiss_index')

print('Loading FAISS index...')
emb = HuggingFaceEmbeddings(
    model_name='sentence-transformers/all-MiniLM-L6-v2',
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True},
)
vs = FAISS.load_local(str(INDEX_DIR), emb, allow_dangerous_deserialization=True)
print(f'Index size: {vs.index.ntotal} vectors\n')

tests = [
    ('agriculture career rural youth India', 0.50),
    ('PMKVY free skill training government scheme', 0.40),
    ('SWAYAM NSDC free online courses', 0.40),
    ('scholarship low income students', 0.35),
    ('Bihar state government scheme', 0.30),
    ('software developer programming course India', 0.35),
]

all_ok = True
for query, min_score in tests:
    results = vs.similarity_search_with_relevance_scores(query, k=3)
    top_doc, top_score = results[0] if results else (None, 0.0)
    ok = top_score >= min_score
    all_ok = all_ok and ok
    status = 'PASS' if ok else 'FAIL'
    src = top_doc.metadata.get('source_file', '?') if top_doc else '?'
    print(f'  {status} [{top_score:.3f}] "{query[:50]}" -> {src}')

print()
print('RETRIEVAL_TEST:', 'ALL PASSED' if all_ok else 'SOME FAILED')
sys.exit(0 if all_ok else 1)
