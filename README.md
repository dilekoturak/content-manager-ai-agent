# Content Manager AI Agent

This project is a simple content idea generation and storage system. It uses Ollama API for content generation, an embedding service to convert text into vectors, and Qdrant as a vector database for storing and searching ideas.

## Features

- Generate content ideas based on a user-provided prompt
- Save selected content ideas into Qdrant vector database
- Search previously saved content ideas using semantic search
- Simple frontend to interact with the backend API

## Architecture

- **Backend**: Node.js + Express server handling API requests
- **Embedding Service**: Converts text to vector embeddings
- **Qdrant**: Vector database for storing and searching content ideas
- **Ollama API**: Language model for generating content ideas
- **Frontend**: Simple HTML/JS interface for prompt input, idea generation, selection, and search

## Getting Started

### Prerequisites

- Docker & Docker Compose installed

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/content-manager-ai-agent.git
   cd content-manager-ai-agent

2. Create a .env file in the backend directory and set environment variables:

PORT=
QDRANT_URL=
EMBEDDING_URL=
OLLAMA_URL=
COLLECTION_NAME=

3. Build and start all services with Docker Compose:

docker-compose up --build

