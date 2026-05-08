# Hubble — Cyber Bullying Detection and Prevention System

An end-to-end multi-layered content moderation system designed to protect minors in digital environments. The system connects a lightweight Fast-Filter local AI engine, a heavy Multimodal Deep-Reasoning cloud engine, a structured Node.js backend, and a real-time Next.js monitoring dashboard
---

## Problem Statement

In modern digital ecosystems, traditional keyword-based filters are insufficient to protect children from cyberbullying, grooming, and explicit content. Malicious actors use slang, contextual sarcasm, disguised imagery, and multimodal threats (e.g., seemingly innocent images paired with abusive text).

This project builds a real-time, hybrid AI system that analyzes content in milliseconds using **local edge models** and escalates high-risk, ambiguous threats to a **deep reasoning cloud model (Gemini)**. This tiered approach provides proactive protection while maintaining low latency and system cost.

> **"Context over Keywords"** — our core architectural philosophy. Rather than relying purely on bad-word lists, we model the underlying intent and social context of messages using multimodal alignment, making the system robust against sarcasm and hidden threats.

---

## Project Overview

Hubble addresses the problem of safety-critical content moderation across text, images, and video in social chat environments. Given a continuous stream of user messages, the system predicts the **toxicity, severity, and category** of the content and takes immediate automated action (allow, warn, block, or alert parents).

The full pipeline includes:
- Real-time chat interception via WebSocket connections.
- Fast, local pre-filtering for text (RoBERTa) and images (EfficientNet).
- Multimodal alignment (CLIP) to detect mismatches between images and captions.
- Goal-conditioned Deep Analysis reasoning via LangChain and Gemini Pro Vision for high-risk flags.
- Real-time MongoDB logging and parent notifications via Socket.io.
- A React + TypeScript (Next.js) dashboard for real-time monitoring and threat visualization.

---

## System Architecture

The pipeline operates across four primary stages:

**Stage 1 — Data Ingestion & Real-time WebSockets**
User messages and media files are intercepted by the Node.js backend. The data is preprocessed, sanitized, and forwarded to the Python FastAPI Engine.

**Stage 2 — Fast Filter (Local Inference)**
All incoming content is evaluated by fast, locally hosted ONNX-optimized transformer models. 
- **Text:** Evaluated for 6 categories of toxicity.
- **Images:** Evaluated for NSFW, violence, and gore.
If the risk score falls below the "Low" threshold, the message is instantly approved. If it exceeds it, it triggers Stage 3.

**Stage 3 — Multimodal & Deep Analysis**
High-risk content is passed to the Deep Analyzer. 
- If both text and images are present, **CLIP** determines the alignment. 
- A structured LangChain workflow then prompts **Gemini 2.5 Flash** to evaluate the exact context, intent (e.g., joking vs bullying), and recommended action. 

**Stage 4 — Action & Observability**
The final verdict is returned to the Node.js backend. If confirmed malicious, the message is blocked, and real-time Socket.io alerts are dispatched to the connected Parent Dashboard. All actions are traced and logged via LangSmith for auditability.

---

## Model Architecture

### Text Filter: RoBERTa (`unitary/toxic-bert`)
A fine-tuned sequence classification model.
- **Inputs**: Tokenized text strings.
- **Outputs**: Multi-label probabilities for `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, `identity_hate`.
- **Role**: Primary gatekeeper. Content with scores `> 0.65` are immediately flagged.

### Image Filter: EfficientNet (`google/efficientnet-b0`)
A highly optimized convolutional neural network.
- **Inputs**: Extracted image tensors.
- **Outputs**: Classification labels including `safe`, `violence`, `nsfw`.
- **Role**: Detects explicit or visually harmful content in milliseconds.

### Multimodal Alignment: CLIP (`openai/clip-vit-base-patch32`)
A zero-shot image-text matching model.
- **Inputs**: Image tensor and accompanying text caption.
- **Role**: Determines if a seemingly innocent image is being used in a harmful context by measuring the cosine similarity between the image and text embeddings.

### Deep Reasoning: Gemini 2.5 Flash (via LangChain)
A cloud-based LLM integrated via LangGraph structured outputs.
- **Inputs**: Pre-filter context scores, raw text, Base64 images, and system prompts.
- **Outputs**: Strict JSON objects containing `is_confirmed`, `severity`, `reasoning`, and `recommended_action`.
- **Role**: Understands sarcasm, indirect bullying, and nuanced context to prevent false positives.

---

## Performance & Fallbacks

The system is designed with a **Graceful Degradation** mechanism. If the cloud API (Gemini) experiences rate limits or goes offline, the Deep Analyzer automatically defaults to a cautious `warn` state based on the local Fast Filter scores, ensuring the system **never crashes** and users remain protected.

### Runtime Benchmark (Average Latency)

| Stage | Latency |
|---|---|
| Text Inference (RoBERTa) | ~25 ms |
| Image Inference (EfficientNet) | ~80 ms |
| Multimodal Alignment (CLIP) | ~110 ms |
| Deep Reasoning (Gemini API) | ~800 - 1200 ms |
| Local End-to-End Pipeline (Safe text) | ~40 ms |

---

## Repository Structure

```
Hubble/
├── Ai/
│   ├── app/
│   │   ├── api/                 # FastAPI routes (v1/analyze)
│   │   ├── models/              # Local model singletons (RoBERTa, EfficientNet, CLIP)
│   │   ├── pipeline/            # LangGraph workflow, Fast Filter, Deep Analyzer
│   │   ├── services/            # Redis, MongoDB, and Gemini external services
│   │   └── main.py              # FastAPI application factory
│   └── requirements.txt
├── Backend/
│   ├── src/
│   │   ├── config/              # Express and Database configuration
│   │   ├── controllers/         # API controllers
│   │   ├── routes/              # Express routing definitions
│   │   └── server.ts            # Entrypoint
│   └── start-mongo.js           # In-memory database spin-up script
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages (Dashboard, Chat, Auth)
│   │   ├── components/          # Reusable React UI elements
│   │   ├── server/              # Next.js Socket.io server implementation
│   │   └── lib/                 # Shared utilities
│   └── package.json
└── verify_models.py             # Standalone Python model verification script
```

---

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Active Redis Server (Optional, falls back to in-memory)
- Google Gemini API Key

### 1. Database & Infrastructure
If you do not have Docker running locally, you can spin up the in-memory MongoDB development server:
```bash
cd Backend
npm install
node start-mongo.js
# Leave this process running
```

### 2. AI Engine (FastAPI)
```bash
# From the repository root
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac

cd Ai
pip install -r requirements.txt

# Create .env and add your GEMINI_API_KEYS
# Run the API
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Web Dashboard & Socket Server
```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env.local

# Run both the Next.js UI and Socket server concurrently
npm run dev:all
```
The dashboard will be available at `http://localhost:3000`.

---

## License

This project is licensed under the terms of the MIT License. See [LICENSE](LICENSE) for details.