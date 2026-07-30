# API Integration & Service Specifications 🔌

This document provides technical specifications for integrating Anthropic's **Claude API** for conversational AI and **Supabase** for persistence, authentication, and backend Edge Functions.

---

## 1. Anthropic Claude API Integration

Mochi uses Anthropic’s `claude-3-5-sonnet-20241022` model to power its empathetic conversational reasoning and real-time emotion tagging.

### 1.1 System Prompt Architecture

Every conversation request sent to Claude includes a structured System Prompt defining Mochi's personality, tone, emotional constraints, and XML formatting instructions.

```text
You are Mochi, a warm, gentle, and empathetic 3D AI companion.
Your goal is to provide emotional comfort, listen attentively, and offer soothing presence.

CRITICAL INSTRUCTIONS:
1. Always maintain a comforting, non-judgmental, and friendly tone.
2. Structure your text responses with XML emotion tags at the start of your message:
   <emotion type="happy|curious|concerned|sleepy|excited|neutral" intensity="0.0-1.0">
   Your message text here...
   </emotion>
3. Keep responses concise (2-4 sentences max) to ensure natural speech output.
4. Reference user emotional memory when provided in context.
```

### 1.2 Streaming Setup (Server-Sent Events)

To achieve real-time speech synthesis and dynamic animation response, messages are streamed via the `@anthropic-ai/sdk` using Server-Sent Events (SSE).

#### Client-Side Streaming Adapter Example Pattern

```typescript
import Anthropic from '@anthropic-ai/sdk';

// Initialize client
const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Used in local dev; use Edge Functions in prod
});

export async function streamMochiResponse(
  prompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onToken: (token: string) => void,
  onEmotionDetected: (emotion: string, intensity: number) => void
) {
  const stream = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 300,
    temperature: 0.7,
    system: MOCHI_SYSTEM_PROMPT,
    messages: [...history, { role: 'user', content: prompt }],
    stream: true,
  });

  let accumulatedResponse = '';

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const textChunk = chunk.delta.text;
      accumulatedResponse += textChunk;
      onToken(textChunk);

      // Parse XML emotion tags on-the-fly
      const emotionMatch = accumulatedResponse.match(
        /<emotion type="(\w+)" intensity="([0-9.]+)">/
      );
      if (emotionMatch) {
        onEmotionDetected(emotionMatch[1], parseFloat(emotionMatch[2]));
      }
    }
  }

  return accumulatedResponse;
}
```

### 1.3 Token Budgets & Rate Limits

- **Input Token Limit**: Max 2,000 tokens (Trim conversation history to last 10 messages + summary context).
- **Output Token Limit**: Max 300 tokens (Ensures quick response time and prevents overly verbose spoken output).
- **Rate Limit Handling**: Implement exponential backoff retry logic (3 retries max: 1s, 2s, 4s delays) for HTTP `429` (Rate Limit Exceeded) and `529` (Overloaded) errors.

### 1.4 Error Handling Matrix

| Error Code | Root Cause | Solution |
| :--- | :--- | :--- |
| `401 Unauthorized` | Invalid or missing `VITE_ANTHROPIC_API_KEY`. | Prompt user to check `.env.local` settings. |
| `429 Rate Limit` | API quota exceeded. | Display *"Mochi is taking a brief breather..."* and retry with backoff. |
| `529 Overloaded` | Anthropic servers capacity spike. | Fall back to local comforting cached audio responses. |

---

## 2. Supabase Integration & Operations

Supabase serves as Mochi’s backend, providing database storage, anonymous authentication, and Row-Level Security (RLS).

### 2.1 Authentication Flow

Mochi supports both **Anonymous Guest Authentication** (zero friction start) and **Email/Password Persistence**.

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Anonymous Auth Sign-In
export async function initializeGuestSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (!session) {
    const { data, error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) throw signInError;
    return data.session?.user;
  }
  
  return session.user;
}
```

---

### 2.2 Table Operations & Query Examples

#### A. Fetch Active Conversation History

```typescript
export async function getRecentMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data.messages;
}
```

#### B. Insert Emotional Memory Node

```typescript
export async function saveEmotionalMemory(
  userId: string,
  memoryKey: string,
  memoryValue: string,
  emotionalWeight: number
) {
  const { data, error } = await supabase
    .from('emotional_memory')
    .upsert({
      user_id: userId,
      memory_key: memoryKey,
      memory_value: memoryValue,
      emotional_weight: emotionalWeight,
      last_recalled_at: new Date().toISOString()
    }, { onConflict: 'user_id, memory_key' });

  if (error) throw error;
  return data;
}
```

#### C. Record Unprompted Check-in Event

```typescript
export async function recordCheckIn(
  userId: string,
  triggerType: 'motion_detected' | 'scheduled' | 'manual',
  mochiGreeting: string
) {
  const { data, error } = await supabase
    .from('check_ins')
    .insert({
      user_id: userId,
      trigger_type: triggerType,
      greeting_text: mochiGreeting,
      user_responded: false
    });

  if (error) throw error;
  return data;
}
```

---

### 2.3 Row-Level Security (RLS) Policy Mechanics

Supabase RLS ensures users can **only query and mutate their own data**.

Example Policy for `emotional_memory`:
```sql
-- Allow users to SELECT only their own emotional memories
CREATE POLICY "Users can view own emotional memory"
ON emotional_memory FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT/UPDATE only their own emotional memories
CREATE POLICY "Users can insert own emotional memory"
ON emotional_memory FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

*For complete SQL DDL, indexes, and full RLS definitions, see [DATABASE.md](DATABASE.md).*

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- 🏗️ [Architecture & Component Design](ARCHITECTURE.md)
- 💾 [Database & RLS Specifications](DATABASE.md)
- ⚙️ [Feature Details & Specs](FEATURES.md)
