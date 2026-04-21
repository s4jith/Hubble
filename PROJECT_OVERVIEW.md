# Hubble (SentinelAI) Architecture & Project Overview

Hubble is a multi-layered **Child Safety and Cyberbullying Detection System** designed to protect minors in digital environments. It combines high-performance local AI models with advanced cloud-based LLMs to provide real-time toxicity filtering, image safety scanning, and parent alerting.

---

## 🏛️ System Architecture

The project is structured into four primary layers, ensuring a separation of concerns between AI processing, business logic, and user interfaces.

### 1. AI Engine (The Brain)
- **Location**: `/Ai`
- **Framework**: Python 3.x, FastAPI
- **Key Technologies**: PyTorch, Transformers, ONNX Runtime, Google Gemini API
- **Capabilities**:
    - **Text toxicity detection**: Identifies harassment and bullying using a fine-tuned DistilBERT model.
    - **Image content scanning**: Detects violence and gore using a local MobileNetV2 model.
    - **Deep contextual analysis**: leverages Google Gemini Pro Vision for complex scene understanding where local models might fail.
    - **Optimization**: Uses ONNX for cross-platform model portability and high-speed inference.

### 2. Backend API (The Orchestrator)
- **Location**: `/Backend`
- **Framework**: Node.js, Express, TypeScript
- **Database**: MongoDB (via Mongoose)
- **Communication**: Socket.io for real-time alerting
- **Key Modules**:
    - `auth`: Multi-role authentication (Parent/Child).
    - `scan`: Integration layer with the AI Engine for content validation.
    - `chat/feed`: Core features where content is monitored in real-time.
    - `alerts`: Logic for triggering parent notifications upon safety violations.
    - `child/parent`: Domain-specific logic for managing profiles and relationships.

### 3. Mobile Application (The Edge)
- **Location**: `/app`
- **Technology**: React Native, TypeScript
- **Purpose**:
    - **Child interface**: A secure environment for messaging and content consumption.
    - **Real-time monitoring**: Captures and sends content for analysis.
    - **Parent-on-the-go**: Provides mobile access to alerts and child activity logs.

### 4. Web Dashboard (The Supervision Hub)
- **Location**: `/web`
- **Technology**: Next.js (React), TypeScript
- **Purpose**:
    - Comprehensive monitoring dashboard for parents.
    - Visualizations of safety scores and behavioral patterns over time.
    - Configuration of safety thresholds and profile management.

---

## ⚡ Key Technical Features

- **Hybrid AI Approach**: Uses lightweight ONNX models for fast local/binary classification and cloud LLMs (Gemini) for high-reasoning tasks.
- **Microservice Design**: The AI engine runs as a standalone service, allowing for independent scaling and deployment.
- **Real-time Feedback Loops**: Socket-based communication ensures that if a child encounters harmful content, the parent is notified within milliseconds.
- **Secure by Design**: Role-based access ensures that children's data is only accessible to their designated guardians.

---

## 📁 Directory Structure

```plaintext
Hubble/
├── Ai/                 # AI Engine, models, training scripts, and FastAPI
│   ├── api/            # API endpoints for analysis
│   ├── local_models/   # Optimized ONNX models (DistilBERT, MobileNetV2)
│   └── gemini_models/  # Logic for cloud-based LLM integration
├── Backend/            # Core backend infrastructure (Node/TS)
│   ├── src/modules/    # Business logic (auth, alerts, child, etc.)
│   └── src/sockets/    # Real-time communication logic
├── app/                # React Native mobile application
└── web/                # Next.js web dashboard
```

---

## 🚀 Future Roadmap
- **Client-Side Inference**: Moving ONNX models directly into the React Native app for zero-latency local filtering.
- **Voice Analysis**: Extending safety features to monitor and filter harmful audio/voice chats.
- **Behavioral Analytics**: Moving beyond content to identify patterns of grooming or cyberbullying over long durations.

---
*Created for the National Hackathon - SentinelAI Project*
