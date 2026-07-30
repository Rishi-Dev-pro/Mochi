# Database Schema, RLS Policies & Migrations 💾

This document contains the complete database specification for the **Mochi AI Companion** system built on Supabase (PostgreSQL).

---

## 1. Relational Entity ERD Overview

```
+-------------------+        1:N        +-----------------------+
|       users       | ----------------> |     conversations     |
+-------------------+                   +-----------------------+
| id (PK)           |                   | id (PK)               |
| email             |                   | user_id (FK)          |
| avatar_url        |                   | messages (JSONB)      |
| preferences (JSON)|                   | mood_summary          |
| created_at        |                   | created_at            |
+-------------------+                   +-----------------------+
          |                                         |
          | 1:N                                     | 1:N
          v                                         v
+-----------------------+               +-----------------------+
|   emotional_memory    |               |       check_ins       |
+-----------------------+               +-----------------------+
| id (PK)               |               | id (PK)               |
| user_id (FK)          |               | user_id (FK)          |
| memory_key            |               | trigger_type          |
| memory_value          |               | greeting_text         |
| emotional_weight      |               | user_responded        |
| created_at            |               | created_at            |
+-----------------------+               +-----------------------+
```

---

## 2. Complete SQL DDL Script

Executing this SQL script creates all required tables, extensions, foreign keys, indexes, and automated updated timestamps.

```sql
-- =============================================================================
-- MOCHI DATABASE SCHEMA INITIALIZATION
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABLE: users
-- Core user profiles extending Supabase auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE PUBLIC.users (
    id UUID PRIMARY KEY REFERENCES AUTH.USERS(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    display_name TEXT DEFAULT 'Friend',
    companion_name TEXT DEFAULT 'Mochi',
    preferences JSONB DEFAULT '{
        "tts_enabled": true,
        "voice_pitch": 1.0,
        "motion_detection_enabled": true,
        "check_in_frequency": "medium"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. TABLE: conversations
-- Chat histories and active conversation session states
-- -----------------------------------------------------------------------------
CREATE TABLE PUBLIC.conversations (
    id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
    user_id UUID REFERENCES PUBLIC.USERS(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Conversation with Mochi',
    messages JSONB DEFAULT '[]'::jsonb NOT NULL, -- Array of {id, role, content, emotion, timestamp}
    mood_summary TEXT DEFAULT 'neutral',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. TABLE: emotional_memory
-- Long-term user memories, facts, preferences, and mood trends
-- -----------------------------------------------------------------------------
CREATE TABLE PUBLIC.emotional_memory (
    id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
    user_id UUID REFERENCES PUBLIC.USERS(id) ON DELETE CASCADE NOT NULL,
    memory_key TEXT NOT NULL, -- e.g., 'favorite_music', 'pet_name', 'work_stress'
    memory_value TEXT NOT NULL, -- e.g., 'Loves lo-fi music when studying'
    emotional_weight FLOAT DEFAULT 0.5 CHECK (emotional_weight BETWEEN 0.0 AND 1.0),
    relevance_count INT DEFAULT 1 NOT NULL,
    last_recalled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_memory_key UNIQUE (user_id, memory_key)
);

-- -----------------------------------------------------------------------------
-- 4. TABLE: check_ins
-- History of proactive or manual well-being check-ins
-- -----------------------------------------------------------------------------
CREATE TABLE PUBLIC.check_ins (
    id UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
    user_id UUID REFERENCES PUBLIC.USERS(id) ON DELETE CASCADE NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('motion_detected', 'scheduled', 'manual')) NOT NULL,
    greeting_text TEXT NOT NULL,
    user_responded BOOLEAN DEFAULT FALSE NOT NULL,
    user_mood_rating INT CHECK (user_mood_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- -----------------------------------------------------------------------------
CREATE INDEX idx_conversations_user_id ON PUBLIC.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON PUBLIC.conversations(updated_at DESC);
CREATE INDEX idx_emotional_memory_user_id ON PUBLIC.emotional_memory(user_id);
CREATE INDEX idx_emotional_memory_key ON PUBLIC.emotional_memory(memory_key);
CREATE INDEX idx_check_ins_user_id ON PUBLIC.check_ins(user_id);
```

---

## 3. Row-Level Security (RLS) Rules

RLS is enabled on all tables to enforce strict data isolation between users.

```sql
-- Enable RLS on all tables
ALTER TABLE PUBLIC.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.emotional_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.check_ins ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES: users
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile" 
    ON PUBLIC.users FOR SELECT USING (AUTH.UID() = id);

CREATE POLICY "Users can update own profile" 
    ON PUBLIC.users FOR UPDATE USING (AUTH.UID() = id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: conversations
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own conversations" 
    ON PUBLIC.conversations FOR SELECT USING (AUTH.UID() = user_id);

CREATE POLICY "Users can insert own conversations" 
    ON PUBLIC.conversations FOR INSERT WITH CHECK (AUTH.UID() = user_id);

CREATE POLICY "Users can update own conversations" 
    ON PUBLIC.conversations FOR UPDATE USING (AUTH.UID() = user_id);

CREATE POLICY "Users can delete own conversations" 
    ON PUBLIC.conversations FOR DELETE USING (AUTH.UID() = user_id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: emotional_memory
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own emotional memory" 
    ON PUBLIC.emotional_memory FOR SELECT USING (AUTH.UID() = user_id);

CREATE POLICY "Users can manage own emotional memory" 
    ON PUBLIC.emotional_memory FOR ALL USING (AUTH.UID() = user_id);

-- -----------------------------------------------------------------------------
-- RLS POLICIES: check_ins
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own check-ins" 
    ON PUBLIC.check_ins FOR SELECT USING (AUTH.UID() = user_id);

CREATE POLICY "Users can insert own check-ins" 
    ON PUBLIC.check_ins FOR INSERT WITH CHECK (AUTH.UID() = user_id);

CREATE POLICY "Users can update own check-ins" 
    ON PUBLIC.check_ins FOR UPDATE USING (AUTH.UID() = user_id);
```

---

## 4. Migration Strategy

Database changes are managed via the **Supabase CLI** using versioned migration files in `backend/migrations/`.

### Migration Workflow
1. **Create New Migration**:
   ```bash
   supabase migration new add_viseme_table
   ```
2. **Write SQL**: Edit the newly created file under `supabase/migrations/<timestamp>_add_viseme_table.sql`.
3. **Test Locally**:
   ```bash
   supabase db reset
   ```
4. **Deploy to Production**:
   ```bash
   supabase db push
   ```

---

## 5. Backup & Disaster Recovery Procedures

1. **Automated Daily Backups**: Managed by Supabase Cloud with 7-day point-in-time recovery (PITR) for Pro tiers.
2. **Manual Schema Snapshot Export**:
   ```bash
   supabase db dump --data-only > backup_data.sql
   supabase db dump --schema-only > backup_schema.sql
   ```

---

## 🔗 Related Documentation
- 📖 [Project Overview README](README.md)
- 🏗️ [Architecture Overview](ARCHITECTURE.md)
- 🔌 [API & Integration Specs](API.md)
- ⚙️ [Feature Details Specs](FEATURES.md)
