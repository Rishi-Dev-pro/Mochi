# Mochi Product Roadmap & Release Schedule 🗺️

This document outlines the multi-phase product roadmap, feature milestones, dependencies, and estimated timelines for the development of **Mochi AI Companion** from initial MVP (`v1.0.0`) through enterprise SaaS expansion (`v2.0.0+`).

---

## 📅 Roadmap Overview at a Glance

```
+-----------------------------------------------------------------------------------+
|  v1.0.0 (MVP)            |  v1.1.0 (Enhancements)     |  v2.0.0 (SaaS Expansion)  |
|  Current Target          |  Q4 2026                   |  Q2 2027                  |
+--------------------------+----------------------------+---------------------------+
| - 3D Character Canvas    | - Custom 3D Accessories    | - Multi-User Accounts     |
| - Claude 3.5 Sonnet Chat | - ElevenLabs Natural Voice | - Cross-Device Sync       |
| - Basic Motion Detector  | - Emotion Knowledge Graphs | - Custom Persona Creation |
| - Supabase Memory Store  | - Binaural Soundscapes     | - Mobile PWA & Widgets    |
| - Web Speech TTS         | - Voice Input Dictation    | - Subscription Billing    |
+-----------------------------------------------------------------------------------+
```

---

## 1. Phase 1: MVP (v1.0.0)

- **Focus**: Core interactive 3D companion experience, streaming conversational AI, local privacy-first motion awareness, and emotional memory persistence.
- **Estimated Timeline**: Months 1-3
- **Dependencies**: React 18, Three.js / R3F, Anthropic API, Supabase Free Tier.

### Feature Deliverables
- [x] **Documentation & Architecture Spec**: Full 10-document technical design suite.
- [ ] **3D Character Renderer**: WebGL R3F canvas rendering expressive companion model with idle and emotional animations (`happy`, `concerned`, `thinking`).
- [ ] **Claude 3.5 Sonnet Integration**: Low-latency token streaming with inline XML emotion tagging (`<emotion type="..." intensity="...">`).
- [ ] **Webcam Presence & Motion Engine**: Browser-based frame-differencing detector noticing user arrival and departure events without video storage.
- [ ] **Persistent Emotional Memory**: Supabase PostgreSQL database schemas (`users`, `conversations`, `emotional_memory`, `check_ins`) with Row-Level Security.
- [ ] **Speech Output**: Basic lip-synced text-to-speech integration via Web Speech API.
- [ ] **Unprompted Check-in System**: Autonomous greeting triggers when user returns after being away from desk.

---

## 2. Phase 2: Companion Enhancements (v1.1.0)

- **Focus**: Richer visual customization, ultra-realistic voice synthesis, deeper emotional graph memory, and ambient audio environments.
- **Estimated Timeline**: Months 4-6
- **Dependencies**: ElevenLabs Streaming API, Web Audio API, IndexedDB local caching.

### Feature Deliverables
- [ ] **High-Fidelity Voice Synthesis**: Integration with ElevenLabs WebSocket streaming API for human-quality voice inflection and viseme generation.
- [ ] **Custom 3D Wardrobe & Accessories**: User ability to customize Mochi's colors, hats, glasses, and room background environments.
- [ ] **Emotional Knowledge Graphs**: Visual memory explorer allowing users to inspect what facts and preferences Mochi has remembered about them.
- [ ] **Binaural Ambient Soundscapes**: Generative procedural background music (lo-fi beats, rain sounds, cozy fireplace) that adapts to companion mood.
- [ ] **Hands-free Voice Mode**: Full duplex voice conversation loop using browser SpeechRecognition without typing.

---

## 3. Phase 3: SaaS Expansion & Ecosystem (v2.0.0+)

- **Focus**: Multi-device synchronization, custom companion persona builder, team/family sharing, mobile companion app, and subscription monetization.
- **Estimated Timeline**: Months 7-12
- **Dependencies**: Stripe Billing, Supabase Realtime Channels, Progressive Web App (PWA) manifest, Web Push Notifications.

### Feature Deliverables
- [ ] **Multi-Device State Sync**: Live state synchronization across laptop browser, tablet, and desktop screens via Supabase Realtime WebSockets.
- [ ] **Custom Companion Creator (Personality Studio)**: Allow users to design custom companion personas (e.g., Study Buddy, Wellness Coach, Playful Friend) with tailored system prompts.
- [ ] **Mobile Progressive Web App (PWA)**: Installable mobile app experience with native push notifications for scheduled wellness check-ins.
- [ ] **Stripe Subscription Billing**: Tiered subscription plans (Free Guest, Pro Companion, Unlimited Voice & Memory).
- [ ] **Enterprise & Team Spaces**: Shared companion presence for remote team virtual offices.

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- 🏗️ [Architecture Overview](ARCHITECTURE.md)
- ⚙️ [Developer Setup Guide](SETUP.md)
- 🔌 [API & Integration Specs](API.md)
- 💾 [Database & RLS Specs](DATABASE.md)
- ⚙️ [Feature Details & Specs](FEATURES.md)
