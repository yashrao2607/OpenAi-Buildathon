# pipeline.py (sketch)
from pathway import Pathway, read_stream
from embeddings import embed_text
import time

app = Pathway()

docs = app.table("docs", columns={
    "doc_id": str, "text": str, "metadata": dict, "embedding": list, "ts": float
})

stream = read_stream("firestore_updates", dtype=dict)  # ensure this connector exists

BATCH_SIZE = 8

@app.compute(stream)
def ingest_update(events):
    batch = []
    for ev in events:
        batch.append(ev)
        if len(batch) >= BATCH_SIZE:
            process_batch(batch)
            batch = []
    if batch:
        process_batch(batch)

def process_batch(batch):
    rows = []
    for ev in batch:
        try:
            emb = embed_text(ev["text"])
        except Exception:
            emb = []  # or skip, or retry logic
        rows.append({
            "doc_id": ev["doc_id"],
            "text": ev["text"],
            "metadata": ev.get("metadata", {}),
            "embedding": emb,
            "ts": ev.get("ts", time.time())
        })
    docs.insert_many(rows)

# vector index creation (double-check API for persistence & config)
vec_index = app.vector_search(table=docs, embedding_col="embedding", key_col="doc_id", dims=1536, persist=True)

if __name__ == "__main__":
    app.run()
