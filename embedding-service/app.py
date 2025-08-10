# app.py
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

class Texts(BaseModel):
    texts: List[str]

@app.post("/embed")
async def embed(texts: Texts):
    embeddings = model.encode(texts.texts).tolist()
    return {"embeddings": embeddings}

