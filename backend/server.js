import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const COLLECTION_NAME = process.env.COLLECTION_NAME || 'content_memory';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OLLAMA_API_URL = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/generate';
const EMBEDDING_URL = (process.env.EMBEDDING_URL || 'http://localhost:5000') + '/embed';

app.post('/generate-content-ideas', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    
    const generatedText = await getContentIdeas(prompt);
    console.log(generatedText);
    res.json({ ideas: generatedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save to Qdrant
app.post('/save-idea', async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: 'idea is required' });

    const id = Date.now();
    await saveToVectorDB(id, idea);

    res.json({ success: true, message: 'Content idea saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search in Qdrant
app.get('/search-memory', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q parameter is required' });

    const queryVector = await getEmbedding(q);

    const searchRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: queryVector,
        limit: 5,
        with_payload: true,
      }),
    });

    if (!searchRes.ok) throw new Error('Qdrant search error');

    const results = await searchRes.json();

    res.json({ results: results.result || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Qdrant collection
async function createCollection() {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  if (res.status === 404) {
    const createRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: {
          size: 384,
          distance: 'Cosine',
        },
      }),
    });
    if (!createRes.ok) throw new Error('Failed to create Qdrant collection');
    console.log('Qdrant collection created:', COLLECTION_NAME);
  } else {
    console.log('Qdrant collection already exists:', COLLECTION_NAME);
  }
}

// Get vector from embedding service
async function getEmbedding(text) {
  const response = await fetch(EMBEDDING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: [text] }),
  });

  if (!response.ok) throw new Error('Embedding service error');

  const data = await response.json();
  return data.embeddings[0];
}

// Save vector to Qdrant
async function saveToVectorDB(id, text) {
  const vector = await getEmbedding(text);

  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      points: [
        {
          id,
          vector,
          payload: { text },
        },
      ],
    }),
  });

  if (!res.ok) throw new Error('Failed to save vector to Qdrant');
}

// Ollama API
async function getContentIdeas(prompt) {
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama2',
      prompt: prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || '';
}

const PORT = process.env.PORT || 3000;

createCollection().then(() => {
  app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
  });
}).catch(console.error);
