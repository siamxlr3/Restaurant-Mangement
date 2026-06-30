-- =============================================================
-- Migration: create_reorder_and_job_log_tables
-- Description: Tables for Smart Recording AI: reorder suggestions and job logs
-- =============================================================

-- ── reorder_suggestion table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS reorder_suggestion (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id        uuid          NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
    suggested_qty        numeric(12,3) NOT NULL CHECK (suggested_qty >= 0),
    reason               text,
    avg_daily_usage      numeric(12,3) NOT NULL DEFAULT 0 CHECK (avg_daily_usage >= 0),
    days_remaining       numeric(10,2),
    is_accepted          boolean       NOT NULL DEFAULT false,
    generated_at         timestamptz   NOT NULL DEFAULT now()
);

-- ── ai_job_log table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_job_log (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type             varchar(50)   NOT NULL,
    status               varchar(50)   NOT NULL CHECK (status IN ('success', 'failed')),
    records_processed    integer       NOT NULL DEFAULT 0,
    error_message        text,
    ran_at               timestamptz   NOT NULL DEFAULT now(),
    duration_ms          integer       NOT NULL DEFAULT 0
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reorder_sug_ingredient_id ON reorder_suggestion(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_reorder_sug_is_accepted   ON reorder_suggestion(is_accepted);
CREATE INDEX IF NOT EXISTS idx_reorder_sug_generated_at  ON reorder_suggestion(generated_at);

CREATE INDEX IF NOT EXISTS idx_ai_job_log_ran_at         ON ai_job_log(ran_at);
CREATE INDEX IF NOT EXISTS idx_ai_job_log_job_type       ON ai_job_log(job_type);
