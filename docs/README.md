# Mochi AI Companion 🐾✨

Mochi is an interactive, emotion-driven 3D AI companion designed to provide comforting, empathetic, and context-aware companionship through real-time voice, vision, and dynamic emotional rendering. Powered by Anthropic's Claude API and Three.js, Mochi acts as a soothing virtual presence that observes, remembers, and proactively checks in on your well-being.

---

## 🌟 Key Features

- **3D Character Rendering**: Real-time 3D expressive character with dynamic blendshapes, fluid idle animations, procedural eye-gaze tracking, and emotion-driven gestures.
- **Conversational Intelligence**: Low-latency, streaming conversational agent powered by Claude 3.5 Sonnet with emotional sentiment tagging embedded in responses.
- **Webcam Motion & Presence Awareness**: Privacy-first, local browser motion detection that notices when you step away, return to your desk, or move around.
- **Persistent Emotional Memory**: Long-term memory store powered by Supabase to remember user preferences, mood trends, past conversations, and key personal details.
- **Natural Voice & Speech Synthesis**: Real-time Text-to-Speech (TTS) integration with lip-sync animation matching spoken phonetic output.
- **Proactive / Unprompted Check-ins**: Autonomous background scheduler that allows Mochi to initiate gentle greetings or check-ins when idle or upon user return.
- **Local & Cloud Sync**: Seamless local-first storage persistence with cloud synchronization via Supabase.

---

## 🛠️ Tech Stack

### Frontend & 3D Web App
- **Core Framework**: React 18 + TypeScript + Vite
- **3D Graphics Engine**: Three.js / React Three Fiber (R3F) + @react-three/drei
- **State Management**: Zustand + React Context
- **Styling**: Vanilla CSS Modules (Design Tokens, Glassmorphism, CSS Custom Properties)
- **Computer Vision**: TensorFlow.js / MediaPipe Face Mesh (Local in-browser vision processing)
- **Audio & Speech**: Web Speech API / ElevenLabs SDK

### Backend & Cloud Services
- **AI / LLM Engine**: Anthropic Claude API (`claude-3-5-sonnet-20241022`)
- **Database & Auth**: Supabase (PostgreSQL + Row-Level Security + Realtime WebSockets)
- **Edge Functions**: Supabase Edge Functions (Deno / TypeScript)

---

## 🚀 Quick Start

To set up Mochi locally on your development machine, check out our step-by-step setup guide:

👉 **[Getting Started & Installation Guide](SETUP.md)**

```bash
# Quick Clone & Run (See SETUP.md for prerequisites)
git clone https://github.com/your-username/mochi.git
cd mochi
npm install
npm run dev
```

---

## 📂 Project Structure Overview

```
mochi/
├── docs/                     # Full project documentation & architectural specs
│   ├── README.md             # Project overview & index
│   ├── ARCHITECTURE.md       # System design, data flow & component hierarchy
│   ├── SETUP.md              # Environment setup & local dev guide
│   ├── API.md                # Claude API & Supabase integration specs
│   ├── DATABASE.md           # Database schemas, RLS policies & SQL DDL
│   ├── FEATURES.md           # Feature breakdown & acceptance criteria
│   ├── DEPLOYMENT.md         # Production deployment strategy & serverless ops
│   ├── CONTRIBUTING.md       # Code style, Git workflow & PR standards
│   ├── TROUBLESHOOTING.md   # Bug resolution matrix & performance tuning
│   └── ROADMAP.md            # Release schedule (v1.0.0 → v2.0.0+)
├── src/                      # Frontend application codebase
│   ├── components/           # UI components (Character, Chat, Motion, Controls)
│   ├── hooks/                # Custom React hooks (useClaude, useMotion, useTTS)
│   ├── services/             # External service adapters (Claude, Supabase, Vision)
│   ├── store/                # Zustand global state stores (emotion, user, chat)
│   ├── assets/               # Static assets (3D GLTF models, audio clips, UI images)
│   ├── styles/               # CSS Design system, tokens, and theme stylesheets
│   ├── utils/                # Helper functions, formatters, and math utilities
│   └── config/               # Application configuration constants
├── backend/                  # Serverless edge functions & DB migrations
│   └── functions/            # Supabase Edge Functions (Claude proxy, webhook handlers)
├── tests/                    # Testing suites
│   ├── components/           # Component unit & integration tests (Vitest)
│   ├── services/             # Service adapter unit tests
│   ├── hooks/                # Custom React hooks tests
│   └── e2e/                  # End-to-end user journey tests (Playwright)
└── public/                   # Public static assets & favicon manifests
```

---

## 📚 Complete Documentation Index

| Document | Description |
| :--- | :--- |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System topology, state flow, component hierarchy, and API boundaries. |
| **[SETUP.md](SETUP.md)** | Detailed developer installation, `.env` guide, and local commands. |
| **[API.md](API.md)** | Specifications for Claude 3.5 Sonnet streaming and Supabase service calls. |
| **[DATABASE.md](DATABASE.md)** | Full SQL schemas, RLS rules, indexes, and migration strategies. |
| **[FEATURES.md](FEATURES.md)** | In-depth feature specs, user stories, and acceptance criteria. |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Hosting instructions for Vercel, Supabase Cloud, and Edge workers. |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Guidelines for PRs, coding standards, and branch strategy. |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Solved common issues, webcam permission fixes, and optimizations. |
| **[ROADMAP.md](ROADMAP.md)** | Project evolution plan from MVP v1.0.0 to enterprise SaaS v2.0.0. |

---

## 🤝 Contributing

We welcome contributions from the community! Please read our **[Contributing Guidelines](CONTRIBUTING.md)** before submitting pull requests or issues.

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
