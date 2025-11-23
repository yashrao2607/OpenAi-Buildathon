# embeddings.py
from google.cloud import aiplatform
import os
import logging
from typing import List

PROJECT_ID = os.getenv("PROJECT_ID", "iit-ropar-474017")
LOCATION = os.getenv("VERTEX_LOCATION", "asia-south1")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "textembedding-gecko@001")

# Initialize Vertex AI once
aiplatform.init(project=PROJECT_ID, location=LOCATION)

# Create model instance once (reuse for all calls)
try:
    _EMBED_MODEL = aiplatform.TextEmbeddingModel.from_pretrained(EMBEDDING_MODEL)
except Exception as e:
    logging.exception("Failed to initialize embedding model: %s", e)
    _EMBED_MODEL = None

def embed_text(text: str) -> List[float]:
    """Return embedding as a list of floats. Raises RuntimeError on failure."""
    if _EMBED_MODEL is None:
        raise RuntimeError("Embedding model not initialized")
    try:
        resp = _EMBED_MODEL.get_embeddings([text])
        # resp is a list-like; each item has .values
        return list(resp[0].values)
    except Exception as e:
        logging.exception("Embedding call failed: %s", e)
        raise

