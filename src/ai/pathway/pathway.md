# Pathway Real-Time RAG Integration for KishanBhai

## Architecture


[Next.js UI] <--HTTPS--> [Next.js API /api/pathway/route.ts] <--HTTP--> [Pathway FastAPI (api_server.py)]
      |                                                                 ^
      |                                                                 |
[Firestore/Storage/API] ---(stream/webhook)---> [Pathway pipeline.py]


## How to Run Locally

1. *Install Python dependencies*
   bash
   cd src/ai/pathway
   pip install -r requirements.txt
   
2. *Start Pathway pipeline*
   bash
   python pipeline.py
   
3. *Start Pathway API server*
   bash
   uvicorn api_server:app --reload --port 8001
   
4. *Set .env*
   - PATHWAY_API_URL=http://localhost:8001
   - OPENAI_API_KEY=... (or Vertex config)
5. *Start Next.js app*
   bash
   npm run dev
   

## Demo Steps

1. Open Market Analyst UI, ask: “What’s the current price for maize in Pune?”
2. Show answer and sources (with timestamp).
3. Update Firestore price for maize in Pune (via Firebase console or Cloud Function).
4. Immediately re-ask the same question — answer should reflect new price.
5. Record this sequence for demo video.

## What to Submit
- GitHub repo link
- Demo video link
- Short slides (optional)

## Notes
- Pathway pipeline ingests Firestore/API updates in real time.
- Vector index is updated incrementally.
- Query API returns RAG answers referencing latest docs.
- Demo shows live update propagation.