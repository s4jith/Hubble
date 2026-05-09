---
title: Hubble AI Engine
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Hubble AI Engine — Cyberbullying Detection Pipeline

A production-grade, layered AI content moderation system for detecting cyberbullying across **text**, **image**, and **video** inputs. Designed as a universal safety tool for social media platforms.

---

## 🏗️ Architecture Overview

```
User Input (text/image/video)
  → Preprocessing (normalization, frame extraction)
  → Fast AI Filter (RoBERTa text, EfficientNet image) — ONNX optimized
  → Risk Scoring Engine (0-100 composite score)
  → LangGraph Router
      ├─ LOW (0-30)    → Allow ✅
      ├─ MEDIUM (31-65) → Warning ⚠️
      └─ HIGH (66-100)  → Deep Analysis 🔴
          ├─ CLIP multimodal alignment
          ├─ Gemini reasoning (via LangChain)
          └─ Final verdict
  → Decision Engine (severity + user history + rules)
  → Response + Logging
```

### Key Components

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Fast Filter** | RoBERTa (ONNX), EfficientNet (ONNX) | Sub-200ms first-pass classification |
| **Risk Scoring** | Custom weighted engine | Composite score with category weights + user history |
| **Routing** | LangGraph state machine | Conditional deep analysis for HIGH-risk content only |
| **Deep Analysis** | CLIP + Gemini (LangChain) | Multimodal alignment + LLM contextual reasoning |
| **Decision Engine** | Rule-based system | ALLOWED / WARNING / BLOCKED with escalation logic |
| **Observability** | LangSmith + structlog | Full pipeline tracing and structured logging |
| **Storage** | MongoDB (motor) + Redis | Moderation logs, user history, result caching |

---

## 📁 Project Structure

```
Ai/
├── app/
│   ├── main.py                  # FastAPI app factory + lifespan
│   ├── config.py                # Pydantic Settings (.env)
│   ├── dependencies.py          # FastAPI dependency injection
│   ├── api/                     # API layer
│   │   ├── router.py            # Route aggregator
│   │   ├── v1/
│   │   │   ├── analyze.py       # POST /analyze/text, /image, /video
│   │   │   ├── health.py        # GET /health
│   │   │   └── history.py       # GET /history/{user_id}
│   │   └── schemas/
│   │       ├── requests.py      # Request models
│   │       └── responses.py     # Response models
│   ├── pipeline/                # Core moderation pipeline
│   │   ├── preprocessor.py      # Input normalization
│   │   ├── fast_filter.py       # RoBERTa + EfficientNet inference
│   │   ├── risk_scorer.py       # Composite risk scoring
│   │   ├── deep_analyzer.py     # CLIP + Gemini deep analysis
│   │   ├── decision_engine.py   # Rule-based verdicts
│   │   └── workflow.py          # LangGraph state machine
│   ├── models/                  # ML model management
│   │   ├── model_registry.py    # Singleton model loader
│   │   ├── text_model.py        # RoBERTa (ONNX)
│   │   ├── image_model.py       # EfficientNet (ONNX)
│   │   ├── clip_model.py        # OpenCLIP
│   │   └── onnx_utils.py        # ONNX export/inference
│   ├── services/                # External integrations
│   │   ├── gemini_service.py    # Gemini via LangChain
│   │   ├── mongo_service.py     # MongoDB (async)
│   │   └── redis_service.py     # Redis (async)
│   ├── observability/           # Monitoring
│   │   ├── langsmith.py         # LangSmith tracing
│   │   └── logging.py           # structlog config
│   └── utils/                   # Helpers
│       ├── image_utils.py       # Image preprocessing
│       └── video_utils.py       # Video frame extraction
├── tests/                       # Test suite
├── model_cache/                 # Downloaded models (gitignored)
├── _legacy/                     # Old code (preserved for reference)
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

---

## 🚀 Quick Start

### 1. Setup Python Environment

```bash
cd Ai
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and database URIs
```

### 3. Start Services (MongoDB + Redis)

```bash
# Using Docker
docker run -d -p 27017:27017 --name hubble-mongo mongo:7
docker run -d -p 6379:6379 --name hubble-redis redis:7-alpine
```

### 4. Run the Server

```bash
cd Ai
python -m app.main
# Or: uvicorn app.main:app --reload --port 8000
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Analyze text
curl -X POST http://localhost:8000/api/v1/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "You are worthless", "user_id": "user123"}'

# Analyze image
curl -X POST http://localhost:8000/api/v1/analyze/image \
  -F "file=@test.jpg" -F "user_id=user123"
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with model/service status |
| `GET` | `/health/ping` | Lightweight liveness probe |
| `POST` | `/api/v1/analyze/text` | Analyze text for cyberbullying |
| `POST` | `/api/v1/analyze/image` | Analyze image for harmful content |
| `POST` | `/api/v1/analyze/video` | Analyze video (frame extraction) |
| `GET` | `/api/v1/history/{user_id}` | Get moderation history |
| `GET` | `/api/v1/history/{user_id}/summary` | Get aggregated user stats |

### Response Schema

All `/analyze/*` endpoints return a unified `AnalysisResponse`:

```json
{
  "request_id": "req_abc123",
  "input_type": "text",
  "status": "WARNING",
  "risk_level": "MEDIUM",
  "risk_score": 45.2,
  "categories": ["insult", "toxic"],
  "confidence": 0.82,
  "decision": {
    "action": "WARNING",
    "reason": "Content flagged as potentially harmful",
    "severity": "medium",
    "should_alert_parent": false
  },
  "processing_time_ms": 156,
  "cached": false
}
```

---

## 🧪 Running Tests

```bash
cd Ai
python -m pytest tests/ -v
```

---

## 📊 Models Used

| Model | Purpose | Size | Backend |
|-------|---------|------|---------|
| `unitary/toxic-bert` | Text toxicity (6 labels) | ~450 MB | ONNX |
| `google/efficientnet-b0` | Image classification | ~20 MB | ONNX |
| `openai/clip-vit-base-patch32` | Multimodal alignment | ~600 MB | PyTorch |
| `gemini-2.0-flash` | Deep contextual reasoning | Cloud API | LangChain |

---

## 🔒 Security Notes

- API keys loaded from `.env` only (never hardcoded)
- CORS restricted in production mode
- User data isolated by `user_id`
- All moderation events logged for audit

---

Built for the **National Hackathon — SentinelAI Project**