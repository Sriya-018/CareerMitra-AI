<div align="center">

# 🧭 CareerMitra AI

### AI-powered career guidance for rural India's youth

**Powered by IBM watsonx.ai Granite · RAG · Watson Speech · React · Node.js**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-career--mitra--ai--psi.vercel.app-2563eb?style=for-the-badge&logo=vercel)](https://career-mitra-ai-psi.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://render.com)
[![IBM watsonx](https://img.shields.io/badge/IBM-watsonx.ai-be95ff?style=for-the-badge&logo=ibm)](https://www.ibm.com/watsonx)

### 🔗 Live App: [https://career-mitra-ai-psi.vercel.app](https://career-mitra-ai-psi.vercel.app)

</div>

---

## What is CareerMitra AI?

CareerMitra AI bridges the **career information gap** for rural youth in India who lack access to quality counselling. In 3 minutes, a student from any village can fill out a profile and receive:

- 🎯 **Personalised career matches** scored against their profile
- 🗺️ **Step-by-step roadmap** from today to their first job (0–36 months)
- 📊 **Skill gap analysis** with free resources to close each gap
- 🏛️ **Government schemes** they are eligible for (PMKVY, NSP, MUDRA, SWAYAM)
- 📄 **Printable resume** generated from their profile
- 💼 **Interview preparation** with AI-generated Q&A for their top career
- 🌐 **10-language translation** of all results (Hindi, Tamil, Telugu, Bengali + more)
- 🎤 **Voice input** via IBM Watson Speech to Text
- 🔊 **Audio readout** of career descriptions via IBM Watson Text to Speech

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│            React + TypeScript + Tailwind CSS (Vite)             │
│     Pages: Home · Assessment · Results · Resume · Interview     │
│            · Admin Dashboard · About                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │  REST (axios)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Express Backend (Node.js)                     │
│                                                                 │
│  POST /api/career          — IBM Granite career assessment      │
│  POST /api/speech/transcribe — Watson Speech to Text            │
│  POST /api/speech/synthesize — Watson Text to Speech            │
│  POST /api/translate       — Watson Language Translator         │
│  POST /api/resume          — Resume data builder                │
│  POST /api/interview-prep  — Interview Q&A (Granite)            │
│  GET  /api/admin/stats     — Usage metrics dashboard            │
└──────────┬──────────────────────────┬───────────────────────────┘
           │  IBM watsonx.ai           │  HTTP
           ▼                          ▼
┌──────────────────┐       ┌──────────────────────────────────────┐
│  IBM Granite LLM │       │   Python RAG Microservice (FastAPI)  │
│  (text/generation│       │   FAISS vector store · 129 vectors   │
│   endpoint)      │       │   sentence-transformers embeddings   │
└──────────────────┘       └──────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS 3, Lucide React icons |
| **Routing** | React Router DOM v7 |
| **HTTP Client** | Axios |
| **Backend** | Node.js 18+, Express 5 |
| **AI — LLM** | IBM watsonx.ai · Granite 13B Instruct v2 |
| **AI — Speech** | IBM Watson Speech to Text · Text to Speech |
| **AI — Translate** | IBM Watson Language Translator |
| **RAG** | Python FastAPI · FAISS · sentence-transformers |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render |

---

## Project Structure

```
CareerMitra AI/
├── frontend/                    # React + TypeScript SPA
│   ├── src/
│   │   ├── components/          # Navbar, Footer, VoiceMicButton, SpeakButton
│   │   ├── hooks/               # useVoiceInput (MediaRecorder + STT)
│   │   ├── pages/               # Home, Assessment, Results, Resume,
│   │   │                        #   InterviewPrep, Admin, About
│   │   ├── services/            # api.ts — all backend calls
│   │   └── types/               # TypeScript interfaces
│   ├── tailwind.config.js
│   ├── vercel.json              # SPA rewrite rule
│   └── vite.config.ts
│
├── backend/                     # Node.js + Express API
│   ├── server.js                # All routes + mock fallback
│   └── services/
│       ├── watsonx.js           # IBM Granite (IAM token + generation)
│       ├── buildPrompt.js       # Structured prompt builder
│       ├── parseGraniteResponse.js
│       ├── rag.js               # RAG sidecar client
│       ├── speechToText.js      # Watson STT
│       ├── textToSpeech.js      # Watson TTS
│       ├── languageTranslator.js # Watson Language Translator
│       ├── resumeGenerator.js   # Resume data builder
│       ├── interviewPrep.js     # Interview Q&A + Granite prompt
│       └── adminStats.js        # In-memory usage metrics
│
├── rag_service/                 # Python FastAPI RAG microservice
│   ├── app.py                   # /retrieve + /health endpoints
│   ├── ingest.py                # FAISS index builder
│   ├── requirements.txt
│   └── faiss_index/             # Built at deploy time (not in git)
│
├── knowledge_base/              # Source documents for RAG ingestion
├── render.yaml                  # Render Blueprint (backend + RAG)
├── Dockerfile.rag               # Docker image for RAG (Python 3.11-slim)
└── .env.example                 # Environment variable reference
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11
- Git

### 1 — Clone & install

```bash
git clone https://github.com/Sriya-018/CareerMitra-AI.git
cd "CareerMitra AI"

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# RAG service
cd rag_service
pip install -r requirements.txt
python ingest.py          # builds the FAISS index once
cd ..
```

### 2 — Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your IBM API keys
```

Required keys in `backend/.env`:

```env
# IBM watsonx.ai
IBM_API_KEY=
IBM_PROJECT_ID=
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-instruct-v2

# Watson Speech to Text
WATSON_STT_API_KEY=
WATSON_STT_URL=https://api.us-south.speech-to-text.watson.cloud.ibm.com

# Watson Text to Speech
WATSON_TTS_API_KEY=
WATSON_TTS_URL=https://api.us-south.text-to-speech.watson.cloud.ibm.com

# Watson Language Translator
WATSON_LT_API_KEY=
WATSON_LT_URL=https://api.us-south.language-translator.watson.cloud.ibm.com

# Optional — protects the admin dashboard
ADMIN_SECRET_KEY=
```

> All IBM services have free Lite tiers. No billing required to get started.

### 3 — Run all services

Open **3 terminals**:

```bash
# Terminal 1 — RAG service (port 5001)
cd rag_service && python app.py

# Terminal 2 — Backend (port 5000)
cd backend && npm start

# Terminal 3 — Frontend (port 3000)
cd frontend && npm run dev
```

Open **http://localhost:3000**

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status for all IBM integrations |
| `POST` | `/api/career` | Career assessment (Granite + RAG) |
| `POST` | `/api/speech/transcribe` | Audio → transcript (Watson STT) |
| `POST` | `/api/speech/synthesize` | Text → MP3 audio (Watson TTS) |
| `POST` | `/api/translate` | Translate results (Watson LT) |
| `POST` | `/api/resume` | Generate resume data |
| `POST` | `/api/interview-prep` | Generate interview Q&A |
| `GET` | `/api/admin/stats` | Usage metrics |

### Example — Career Assessment

```bash
curl -X POST http://localhost:5000/api/career \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Priya Kumari",
    "age": "18",
    "gender": "Female",
    "education": "Class 11-12 (Intermediate)",
    "state": "Bihar",
    "district": "Nalanda",
    "preferredLanguage": "Hindi",
    "interests": ["Healthcare", "Education"],
    "familyIncome": "Below ₹1,00,000"
  }'
```

---

## Deployment

| Service | Platform | Config file |
|---|---|---|
| Frontend | Vercel | `frontend/vercel.json` |
| Backend | Render | `render.yaml` |
| RAG Service | Render (Docker) | `Dockerfile.rag` |

### Environment variables for Vercel

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_ADMIN_KEY` | Same as `ADMIN_SECRET_KEY` on Render |

See the full deployment guide in [`render.yaml`](render.yaml) and [`Dockerfile.rag`](Dockerfile.rag).

---

## Features at a Glance

| Feature | Description |
|---|---|
| 🤖 **IBM Granite AI** | Generates personalised career reports via watsonx.ai |
| 📡 **RAG** | Retrieves real Indian career data from a 129-vector FAISS index |
| 🎤 **Voice Input** | Speak answers using IBM Watson Speech to Text (en-US_Multimedia) |
| 🔊 **Voice Output** | Listen to career descriptions via IBM Watson Text to Speech |
| 🌐 **10 Languages** | Translate results to Hindi, Tamil, Telugu, Bengali, Marathi + more |
| 📄 **Resume Generator** | Printable / PDF-ready resume built from assessment data |
| 💼 **Interview Prep** | AI-generated Q&A with model answers and coaching tips |
| 📊 **Admin Dashboard** | Usage metrics: assessments, states, interests, language distribution |
| 🌙 **Dark Mode** | Persistent dark/light theme toggle |
| 📱 **Responsive** | Mobile-first design, works on all screen sizes |
| 🔄 **Mock Fallback** | Full offline mock when IBM keys are not configured |

---

## Supported Languages (Translation)

Hindi · Tamil · Telugu · Bengali · Marathi · Gujarati · Kannada · Malayalam · Punjabi · Odia

---

<div align="center">

Made with ❤️ for India's rural youth

**CareerMitra AI** · Powered by [IBM watsonx.ai](https://www.ibm.com/watsonx)

</div>
