# Feature Specifications & Acceptance Criteria ⚙️

This document details the functional specifications, user stories, acceptance criteria, known limitations, and technical edge cases for each feature in the **Mochi AI Companion** system.

---

## 1. Feature Specifications Matrix

### 1.1 Feature 1: 3D Character Rendering & Dynamic Animation Blending

- **User Story**: *As a user, I want to see an interactive, expressive 3D character that physically reacts to our conversation so that Mochi feels alive and engaging.*
- **Technical Specs**:
  - Render a GLTF/GLB avatar using React Three Fiber (R3F) at 60 FPS on standard desktop GPUs.
  - Implement dynamic blendshapes (morph targets) for `mouthOpen`, `blinkLeft`, `blinkRight`, `smile`, and `eyebrowRaise`.
  - Maintain procedural cursor/face tracking for head rotation (-30° to +30° yaw/pitch).

#### Acceptance Criteria
- [x] Character model loads in `< 2.5 seconds` on initial application load.
- [x] Smooth cross-fade animation transitions (`crossFadeTo`) between states (`idle` -> `happy` -> `thinking`).
- [x] Natural procedural automatic eye blinking every 3-6 seconds.
- [x] Responsive canvas resizing across standard desktop and laptop screen aspect ratios.

---

### 1.2 Feature 2: Conversational AI with Claude 3.5 Sonnet

- **User Story**: *As a user, I want to have fluid, natural conversations with an empathetic AI that remembers context and responds with emotional nuance.*
- **Technical Specs**:
  - Stream token responses via Anthropic Claude API (`claude-3-5-sonnet-20241022`).
  - Extract embedded `<emotion>` tags from token stream and trigger corresponding visual/audio cues.
  - Enforce a 300 max token output limit for rapid response delivery.

#### Acceptance Criteria
- [x] First message token displays in `< 800ms` from user submit.
- [x] Emotion tags (`happy`, `concerned`, `curious`, etc.) correctly trigger character state updates in real-time.
- [x] Handle connection drops gracefully with an automatic fallback UI state (*"Mochi lost connection for a moment..."*).

---

### 1.3 Feature 3: Webcam Motion Detection & Presence Awareness

- **User Story**: *As a user, I want Mochi to notice when I arrive at or step away from my desk without uploading my video feed anywhere.*
- **Technical Specs**:
  - Frame-differencing algorithm running locally inside HTML5 `<canvas>` at 5 FPS.
  - Calculate average pixel variance percentage across consecutive frames.
  - Zero camera frames saved locally or transmitted over network sockets (100% privacy-compliant).

#### Acceptance Criteria
- [x] Requests webcam permission with clear explanation dialog.
- [x] Detects `USER_DEPARTED` state when motion drops below sensitivity threshold for > 2 minutes.
- [x] Detects `USER_RETURNED` state when motion spikes above threshold after departure.
- [x] Provides a one-click manual toggle to disable camera feed completely.

---

### 1.4 Feature 4: Persistent Emotional Memory

- **User Story**: *As a user, I want Mochi to remember key personal facts and past topics we discussed so that our relationship feels continuous.*
- **Technical Specs**:
  - Store key-value memory records in Supabase `emotional_memory` table.
  - Extract emotional memory keywords automatically during conversation processing.
  - Inject relevant top 5 memory records into Claude system prompt context.

#### Acceptance Criteria
- [x] Memory records persist across browser refresh and user login sessions.
- [x] Memory weights decay or strengthen based on recall frequency.
- [x] User can view, edit, or delete stored emotional memories from the Settings menu.

---

### 1.5 Feature 5: Text-to-Speech (TTS) & Lip Synchronization

- **User Story**: *As a user, I want Mochi to speak out loud with natural voice inflection and realistic mouth movement matching the speech.*
- **Technical Specs**:
  - Primary output via Web Speech API (`SpeechSynthesisUtterance`).
  - Optional high-fidelity output via ElevenLabs WebSockets.
  - Calculate audio amplitude levels to drive `MochiCharacter` mouth morph targets.

#### Acceptance Criteria
- [x] Speech playback begins within `< 300ms` of receiving the first text paragraph stream.
- [x] Mouth animation opens/closes in sync with spoken audio volume peaks.
- [x] Global mute button instantly halts active speech synthesis.

---

### 1.6 Feature 6: Unprompted & Proactive Check-ins

- **User Story**: *As a user, I want Mochi to gently greet me when I return to my computer or haven't talked in a while.*
- **Technical Specs**:
  - Client-side background timer triggered by `USER_RETURNED` motion events.
  - Evaluates user's last recorded mood before generating an opening check-in line.

#### Acceptance Criteria
- [x] Triggers gentle greeting (e.g., *"Welcome back! Hope you had a nice break."*) upon user return.
- [x] Limits proactive check-ins to maximum once every 30 minutes to avoid annoyance.

---

### 1.7 Feature 7: Local & Cloud Storage Sync

- **User Story**: *As a user, I want my companion settings and chat history saved even if I'm not logged into an account.*
- **Technical Specs**:
  - Local-first fallback using `localStorage` / `IndexedDB`.
  - Automatic background sync to Supabase Cloud upon guest account upgrade.

#### Acceptance Criteria
- [x] App operates fully in offline/guest mode with local state persistence.
- [x] Smooth data migration when user connects a Supabase account.

---

## 2. Known Limitations & Technical Trade-offs

1. **Browser Voice Constraints**: Web Speech API voices vary significantly between operating systems (macOS Siri vs. Windows OneCore).
2. **WebGL Hardware Variations**: Low-end integrated GPUs may experience FPS drops below 30 FPS when heavy blur/glassmorphism overlays are rendered over 3D canvas.
3. **Webcam Lighting Dependency**: Motion detection relies on ambient light contrast; low-light rooms may produce false-positive `USER_DEPARTED` events.

---

## 3. Future Roadmap Feature Candidates

- 🎧 **Binaural Ambient Soundscapes**: Background soothing music generators synced to companion mood.
- 📱 **Mobile PWA Support**: Installable Progressive Web App with desktop notification check-ins.
- 🎨 **Custom 3D Skins**: Customizable fur patterns, accessories, and environmental rooms.

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- 🏗️ [Architecture & Component Design](ARCHITECTURE.md)
- 🔌 [API Specs](API.md)
- 💾 [Database & RLS Specs](DATABASE.md)
