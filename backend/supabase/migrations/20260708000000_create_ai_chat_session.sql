-- ============================================================
-- Migration: create_ai_chat_session
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_chat_session (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        text,
    messages        jsonb NOT NULL DEFAULT '[]'::jsonb,
    started_at      timestamptz NOT NULL DEFAULT now(),
    last_message_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_session_staff
    ON ai_chat_session(staff_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_session_last_message
    ON ai_chat_session(last_message_at DESC);
