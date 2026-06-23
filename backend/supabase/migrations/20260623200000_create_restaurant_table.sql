-- ============================================================
-- Migration: Create restaurant_table
-- ============================================================

-- Create status enum type
DO $$ BEGIN
    CREATE TYPE table_status AS ENUM ('open', 'occupied', 'cleaning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create restaurant_table table
CREATE TABLE IF NOT EXISTS restaurant_table (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    capacity    INTEGER NOT NULL CHECK (capacity >= 1 AND capacity <= 50),
    status      table_status NOT NULL DEFAULT 'open',
    section     TEXT NOT NULL DEFAULT 'Main Hall',
    waiter_id   UUID REFERENCES staff(id) ON DELETE SET NULL,
    deleted_at  TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT restaurant_table_name_unique UNIQUE (name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_table_status      ON restaurant_table (status)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_table_section     ON restaurant_table (section)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_table_deleted_at  ON restaurant_table (deleted_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_table_created_at  ON restaurant_table (created_at)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_table_waiter_id   ON restaurant_table (waiter_id)   WHERE deleted_at IS NULL;

-- updated_at trigger (reuse shared function if exists, otherwise create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at_restaurant_table ON restaurant_table;
CREATE TRIGGER set_updated_at_restaurant_table
    BEFORE UPDATE ON restaurant_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
