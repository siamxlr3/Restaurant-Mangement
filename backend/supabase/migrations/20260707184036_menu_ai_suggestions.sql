-- ============================================================
-- Menu Performance AI Module
-- Tables: ai_menu_suggestion, ai_insight
-- ============================================================

-- ── ai_menu_suggestion ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_menu_suggestion (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id    uuid        REFERENCES menu_item(id) ON DELETE CASCADE,
    action          text        NOT NULL CHECK (action IN ('remove', 'reprice', 'promote', 'bundle')),
    reason          text        NOT NULL,
    impact_estimate text,
    is_applied      boolean     NOT NULL DEFAULT false,
    generated_at    timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_menu_suggestion_item_id ON ai_menu_suggestion(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_ai_menu_suggestion_action  ON ai_menu_suggestion(action);
CREATE INDEX IF NOT EXISTS idx_ai_menu_suggestion_created ON ai_menu_suggestion(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_menu_suggestion_applied ON ai_menu_suggestion(is_applied);

-- ── ai_insight ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insight (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    feature      text        NOT NULL,
    payload      jsonb       NOT NULL DEFAULT '{}',
    is_read      boolean     NOT NULL DEFAULT false,
    is_dismissed boolean     NOT NULL DEFAULT false,
    generated_at timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_insight_feature  ON ai_insight(feature);
CREATE INDEX IF NOT EXISTS idx_ai_insight_created  ON ai_insight(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insight_read     ON ai_insight(is_read);
CREATE INDEX IF NOT EXISTS idx_ai_insight_dismissed ON ai_insight(is_dismissed);
