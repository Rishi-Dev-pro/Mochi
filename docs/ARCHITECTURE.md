# Architecture & System Design 🏗️

This document details the high-level architecture, component communication flows, state management paradigms, and service integrations for the **Mochi AI Companion** system.

---

## 1. System Overview & Diagram

Mochi is designed as a hybrid local-first web application. Sensitive computer vision and motion processing occur locally inside the user's browser, while high-level natural language reasoning and long-term memory persistence are handled by Anthropic's Claude API and Supabase Cloud.

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|                                                                                   |
|  +-----------------------+   Webcam Stream   +---------------------------------+  |
|  |     MotionDetector    | ----------------> |  MediaPipe / TensorFlow Vision  |  |
|  |  (Camera Permission)  |                   |    (Motion & Presence Engine)   |  |
|  +-----------------------+                   +---------------------------------+  |
|              |                                                |                   |
|              | User Presence/Motion Signal                    | Motion Events     |
|              v                                                v                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             ZUSTAND STATE STORE                             |  |
|  |  [User Session]  [Emotional State]  [Active Conversation]  [Motion State]   |  |
|  +-----------------------------------------------------------------------------+  |
|          ^                                 |                           ^          |
|          | State Updates                   | Render Props              | Audio    |
|          v                                 v                           | Trigger  |
|  +-----------------------+   +---------------------------+   +-----------------+  |
|  |     ChatInterface     |   |       MochiCharacter      |   |   SpeechOutput  |  |
|  | (Message Log & Input) |   |   (Three.js 3D Avatar)    |   |  (TTS & Audio)  |  |
|  +-----------------------+   +---------------------------+   +-----------------+  |
|              |                                                                    |
+--------------|--------------------------------------------------------------------+
               | SSE Stream Request / Sync
               v
+-----------------------------------------------------------------------------------+
|                                 BACKEND / CLOUD                                   |
|                                                                                   |
|  +-----------------------------------+     +-----------------------------------+  |
|  |     Supabase Edge Functions       |     |          Supabase Cloud           |  |
|  | (Claude API Proxy & Emotion Tag)  | <-> |  (PostgreSQL + RLS + Vectors)    |  |
|  +-----------------------------------+     +-----------------------------------+  |
|                  |                                                                |
|                  | Streaming Prompt + History Context                             |
|                  v                                                                |
|  +-----------------------------------------------------------------------------+  |
|  |                         Anthropic Claude API Engine                         |  |
|  |                     (claude-3-5-sonnet-20241022 Model)                      |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Component Breakdown

The frontend application consists of five primary core components, each decoupled and bound together via the centralized state store.

### 2.1 `MochiCharacter` (3D Rendering Component)
- **Role**: Renders the 3D interactive avatar, manages animation transitions, procedural eye-gaze tracking, and blendshape morph targets.
- **Tech**: Three.js, React Three Fiber (R3F), `@react-three/drei`, GLTF Loader.
- **Key Responsibilities**:
  - Load GLTF/GLB character models and associated animation clips (Idle, Happy, Thinking, Concerned, Sleeping, Celebrating).
  - Interpolate smoothly between emotional states using `animation-blending` weights.
  - Dynamically modify morph target blendshapes (`mouthOpen`, `eyesBlink`, `cheeksBlush`, `eyebrowsRaised`) in sync with audio output and emotional state.
  - Track user cursor position or video face center for procedural head tracking.

### 2.2 `ChatInterface` (User Input & Output Console)
- **Role**: Provides a clean UI for text input, voice dictation, conversation history display, and streaming indicator.
- **Tech**: React, Vanilla CSS Glassmorphic Styling, Web Speech API (SpeechRecognition).
- **Key Responsibilities**:
  - Capture typed text or voice-to-text transcriptions.
  - Render message bubbles with time tags and emotional indicators.
  - Handle token-by-token streaming UI updates as response chunks arrive from the backend.
  - Provide controls for sound toggles, voice selection, and manual check-in triggers.

### 2.3 `MotionDetector` (Webcam Vision Pipeline)
- **Role**: Processes webcam frames strictly in-memory to detect user presence, motion level, and user departure/arrival events.
- **Tech**: HTML5 `<video>`, Canvas 2D frame differencing / MediaPipe Face Mesh.
- **Key Responsibilities**:
  - Request video stream permission with privacy-first clear indicators.
  - Execute frame differencing algorithms to calculate motion magnitude percentage (0-100%).
  - Trigger `USER_DEPARTED`, `USER_RETURNED`, and `USER_PRESENT_IDLE` events in the state store.
  - Discard raw camera frames immediately (zero video frames stored or sent over the network).

### 2.4 `SpeechOutput` (Text-to-Speech & Phoneme Sync)
- **Role**: Synthesizes Mochi’s text responses into natural spoken audio and generates mouth morph blendshape parameters for lip synchronization.
- **Tech**: Web Speech API (`SpeechSynthesisUtterance`) or ElevenLabs Streaming API.
- **Key Responsibilities**:
  - Queue incoming text segments for playback.
  - Analyze speech audio amplitude / visemes to emit real-time `visemeId` and `volume` frames.
  - Notify `MochiCharacter` to modulate mouth mesh morph targets matching speech rhythm.

### 2.5 `EmotionalStatus` (Emotional State Visualizer)
- **Role**: Displays Mochi's current mood, affection score, energy level, and memory tags.
- **Tech**: React, CSS Custom Properties gradient animations.
- **Key Responsibilities**:
  - Render a unobtrusive UI HUD showing emotional metrics (Happiness, Curiosity, Comfort, Energy).
  - Display active status badges (e.g., *"Noticed you returned!"*, *"Listening..."*, *"Thinking deeply..."*).

---

## 3. End-to-End Data Flow

The lifecycle of a single interaction (e.g., User sends a message or returns to desk) follows this structured pipeline:

```
[1. Trigger Input] -> [2. Motion/Chat Event] -> [3. Store Dispatch] -> [4. Context Assembly]
                                                                                |
[8. Character Animation & TTS] <- [7. SSE Response Stream] <- [6. Claude LLM] <- [5. Supabase Proxy]
```

1. **Trigger Input**: User types *"I had a really stressful day at work"*, or `MotionDetector` detects the user returning after 30 minutes away.
2. **Event Dispatch**: The input is captured by `ChatInterface` or `MotionDetector` and dispatched to the `useConversationStore`.
3. **Context Assembly**:
   - Fetches the last 10 messages from current conversation history.
   - Queries `emotional_memory` from Supabase for relevant user context (e.g., user name, work project details).
   - Injects Mochi's system prompt containing emotional state instructions.
4. **Backend Request**: Client sends context to Supabase Edge Function (`/functions/v1/chat`).
5. **Claude Execution**: Edge function calls Anthropic API with streaming enabled (`claude-3-5-sonnet-20241022`).
6. **Streaming & Emotion Tagging**:
   - Claude streams tokens wrapped with emotion metadata headers, e.g.: `<emotion type="empathy" intensity="0.8">I'm so sorry to hear that...</emotion>`.
7. **Client Processing**:
   - `ChatInterface` renders tokens as they stream in.
   - `MochiCharacter` receives emotion tag `empathy` -> blends animation state to `concerned_comfort`.
   - `SpeechOutput` begins audio synthesis for incoming text chunks.
8. **State Memory Persistence**: Once message completes, conversation entry and extracted emotional memory nodes are asynchronously saved to Supabase.

---

## 4. State Management Approach

Mochi utilizes **Zustand** for predictable, atomic state management across independent components without unnecessary React re-renders.

### State Slice Hierarchy

1. **`useEmotionStore`**:
   - `currentEmotion`: `'happy' | 'curious' | 'concerned' | 'sleepy' | 'excited' | 'neutral'`
   - `intensity`: `0.0` to `1.0`
   - `energyLevel`: `0.0` to `1.0`
   - `setEmotion(emotion, intensity)`
2. **`useMotionStore`**:
   - `isCameraActive`: `boolean`
   - `userPresent`: `boolean`
   - `motionMagnitude`: `number`
   - `lastSeenTimestamp`: `number`
3. **`useChatStore`**:
   - `messages`: `Array<Message>`
   - `isStreaming`: `boolean`
   - `activeConversationId`: `string`
4. **`useUserStore`**:
   - `userProfile`: `{ id, name, preferences }`
   - `isAuthenticated`: `boolean`

---

## 5. Database Schema Summary

Mochi uses Supabase (PostgreSQL) with 4 main relational tables:

- **`users`**: User identity, settings, and companion preferences.
- **`conversations`**: Thread meta, timestamps, and aggregate session mood.
- **`emotional_memory`**: Key user facts, emotional insights, and memory weight tags.
- **`check_ins`**: History of automated and manual well-being check-ins.

*For complete SQL DDL, indexes, and Row-Level Security (RLS) definitions, see [DATABASE.md](DATABASE.md).*

---

## 6. External API Integration Summary

### Anthropic Claude API
- Uses `claude-3-5-sonnet-20241022` via Server-Sent Events (SSE).
- Structured system prompt enforcing Mochi's persona, empathetic tone boundaries, and XML emotion tags.

### Supabase Cloud Services
- **Auth**: Email/Password + Anonymous Guest Auth.
- **Database**: PostgreSQL with Row-Level Security policies.
- **Realtime**: WebSockets for live status synchronization across tabs.

---

## 🔗 Related Documentation
- 📖 [Setup & Developer Environment Guide](SETUP.md)
- 🔌 [API Integration Specifications](API.md)
- 💾 [Database & RLS Policy Schema](DATABASE.md)
- ⚙️ [Feature Details & Acceptance Criteria](FEATURES.md)
