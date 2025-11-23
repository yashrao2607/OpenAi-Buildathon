# api_server.py
import os
import logging
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from embeddings import embed_text
from google.cloud import aiplatform

PROJECT_ID = os.getenv("PROJECT_ID", "iit-ropar-474017")
LOCATION = os.getenv("VERTEX_LOCATION", "asia-south1")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-pro-preview-0409")
PATHWAY_QUERY_URL = os.getenv("PATHWAY_QUERY_URL", "http://localhost:8080/query")

# Init Vertex AI once
aiplatform.init(project=PROJECT_ID, location=LOCATION)
try:
    _LLM = aiplatform.TextGenerationModel.from_pretrained(LLM_MODEL)
except Exception as e:
    logging.exception("Failed to initialize LLM model: %s", e)
    _LLM = None

app = FastAPI()

class QueryReq(BaseModel):
    query: str
    top_k: int = 4

def call_gemini_sync(prompt: str, max_tokens: int = 512) -> str:
    if _LLM is None:
        raise RuntimeError("LLM not initialized")
    resp = _LLM.predict(prompt=prompt, temperature=0.2, max_output_tokens=max_tokens)
    return getattr(resp, "text", str(resp))

@app.post("/query")
async def handle_query(req: QueryReq):
    # basic validation
    if not req.query or len(req.query) < 3:
        raise HTTPException(status_code=400, detail="query too short")

    # embed query
    try:
        q_emb = embed_text(req.query)
    except Exception as e:
        logging.exception("Embedding failed")
        raise HTTPException(status_code=500, detail="Embedding error")

    # call Pathway (with timeout)
    if not PATHWAY_QUERY_URL:
        raise HTTPException(status_code=500, detail="PATHWAY_QUERY_URL not configured")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(PATHWAY_QUERY_URL, json={"query_embedding": q_emb, "top_k": req.top_k})
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as e:
        logging.exception("Pathway query failed: %s", e)
        raise HTTPException(status_code=502, detail="Pathway query failed")

    hits = data.get("hits", [])
    context_text = "\n\n".join([h.get("text","") for h in hits])[:5000]  # cap length
    prompt = f"Context:\n{context_text}\n\nQuestion: {req.query}\nAnswer concisely:"

    # call Gemini (sync) - consider moving to async if Vertex client supports it
    try:
        answer = call_gemini_sync(prompt)
    except Exception as e:
        logging.exception("LLM call failed: %s", e)
        raise HTTPException(status_code=502, detail="LLM generation failed")

    return {"answer": answer, "sources": hits}
