-- =============================================================
-- Migration: create_app_settings_table
-- Description: App Settings and API Key Configuration table
-- =============================================================

-- Create app_setting table
CREATE TABLE IF NOT EXISTS app_setting (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key          text        NOT NULL,
    value        text,                                  -- AES-256-GCM encrypted for sensitive keys
    "group"      text        NOT NULL,                  -- 'general' | 'payments' | 'ai' | 'notifications'
    label        text        NOT NULL,
    description  text,
    is_encrypted boolean     NOT NULL DEFAULT false,    -- true = value is encrypted at rest
    type         text        NOT NULL DEFAULT 'text',   -- 'text' | 'password' | 'boolean' | 'number'
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT app_setting_type_check
        CHECK (type IN ('text', 'password', 'boolean', 'number'))
);

-- Unique index: one key per group
CREATE UNIQUE INDEX IF NOT EXISTS app_setting_group_key_idx
    ON app_setting ("group", key);

-- Index for fast group lookups
CREATE INDEX IF NOT EXISTS app_setting_group_idx
    ON app_setting ("group");

-- Index for created_at range queries
CREATE INDEX IF NOT EXISTS app_setting_created_at_idx
    ON app_setting (created_at);

-- ── updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER set_app_setting_updated_at
    BEFORE UPDATE ON app_setting
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
