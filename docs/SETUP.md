# Environment Setup & Local Development ⚙️

This guide provides step-by-step instructions for setting up your local development environment to run, test, and build the **Mochi AI Companion** application.

---

## 1. Prerequisites

Before setting up Mochi, ensure your development machine meets the following requirements:

- **Node.js**: `v18.18.0` or higher (Recommended: LTS `v20.x`)
- **Package Manager**: `npm` `v9.x` or higher (or `pnpm` / `yarn`)
- **Git**: `v2.x` or higher
- **Modern Browser**: Chrome, Edge, Safari, or Firefox with **WebGL 2.0** and **Web Speech API** support.
- **Webcam**: Functional webcam for testing motion detection features (optional for basic chat).
- **Accounts Needed**:
  - [Anthropic Console Account](https://console.anthropic.com/) (For Claude API Key)
  - [Supabase Cloud Account](https://supabase.com/) (For Database & Edge Functions)

---

## 2. Step-by-Step Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/mochi.git
cd mochi
```

### Step 2: Install Node Dependencies
```bash
npm install
```

---

## 3. Environment Variables Configuration

Create a `.env.local` file in the root project directory by copying the sample template below:

```bash
cp .env.example .env.local
```

### `.env.local` Template

```env
# ==============================================================================
# MOCHI LOCAL ENVIRONMENT CONFIGURATION
# ==============================================================================

# App Configuration
VITE_APP_NAME="Mochi AI Companion"
VITE_APP_ENV="development"
VITE_APP_URL="http://localhost:5173"

# Anthropic Claude API Configuration
# Note: For production, calls go through Supabase Edge Function to protect keys.
# In local dev mode, this can be called directly or via local backend function.
VITE_ANTHROPIC_API_KEY="sk-ant-api03-YOUR_ANTHROPIC_API_KEY_HERE"
VITE_CLAUDE_MODEL="claude-3-5-sonnet-20241022"

# Supabase Database & Auth Configuration
VITE_SUPABASE_URL="https://YOUR_SUPABASE_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY_HERE"

# Vision & Motion Detection Controls
VITE_ENABLE_WEBCAM_MOTION="true"
VITE_MOTION_SENSITIVITY="0.15"

# Speech & Voice Output Settings
VITE_ENABLE_TTS="true"
VITE_TTS_PROVIDER="web-speech" # Options: 'web-speech' | 'elevenlabs'
VITE_ELEVENLABS_API_KEY="" # Optional: Required only if VITE_TTS_PROVIDER='elevenlabs'
VITE_ELEVENLABS_VOICE_ID="" # Optional: ElevenLabs custom voice model ID
```

---

## 4. Supabase Database & Backend Setup

### Option A: Using Supabase Cloud (Recommended for Quickstart)

1. Log into your [Supabase Dashboard](https://database.new) and create a new project named `mochi-dev`.
2. Copy your **Project URL** and **Anon API Key** from **Project Settings -> API** into your `.env.local`.
3. Open the **SQL Editor** in your Supabase Dashboard.
4. Open the SQL DDL file provided in [`DATABASE.md`](DATABASE.md#complete-sql-ddl-script) and execute it to create all tables (`users`, `conversations`, `emotional_memory`, `check_ins`) and RLS policies.

### Option B: Local Supabase Development CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Start local Supabase container cluster
supabase start

# Apply database migrations
supabase db reset
```

---

## 5. Running the Application Locally

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Once started, open your browser and navigate to:
👉 `http://localhost:5173`

---

## 6. Running Tests

Mochi uses **Vitest** for unit/integration testing and **Playwright** for End-to-End browser testing.

```bash
# Run all component and hook unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run coverage report
npm run test:coverage

# Run End-to-End (E2E) Playwright tests
npm run test:e2e
```

---

## 7. Building for Production

To create an optimized production build:

```bash
# Type-check and compile application
npm run build

# Preview the production build locally
npm run preview
```

The output bundle will be generated in the `dist/` directory, ready for deployment.

---

## 🔗 Related Documentation
- 📘 [Project README Overview](README.md)
- 🏗️ [Architecture & Component Design](ARCHITECTURE.md)
- 🔌 [API Integration Reference](API.md)
- 💾 [Database Schemas & RLS Rules](DATABASE.md)
