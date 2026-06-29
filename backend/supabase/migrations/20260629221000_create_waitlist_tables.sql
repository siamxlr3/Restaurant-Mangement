-- =============================================================
-- Migration: create_waitlist_tables
-- Description: Waitlist and waitlist_notifications tables
-- =============================================================

-- ── waitlist_status enum ─────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE waitlist_status AS ENUM ('waiting', 'notified', 'seated', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── waitlist table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
    id             uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id    uuid            NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    party_size     int             NOT NULL DEFAULT 2 CHECK (party_size > 0),
    joined_at      timestamptz     NOT NULL DEFAULT now(),
    est_wait_mins  int             NOT NULL DEFAULT 0 CHECK (est_wait_mins >= 0),
    status         waitlist_status NOT NULL DEFAULT 'waiting',
    created_at     timestamptz     NOT NULL DEFAULT now(),
    updated_at     timestamptz     NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);

-- ── waitlist_notifications table ──────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_notifications (
    id             uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    waitlist_id    uuid            NOT NULL REFERENCES waitlist(id) ON DELETE CASCADE,
    channel        text            NOT NULL, -- 'sms' | 'email' ...
    recipient      text            NOT NULL,
    message        text            NOT NULL,
    type           text            NOT NULL, -- 'alert' | 'confirmation' ...
    status         text            NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
    retry_count    int             NOT NULL DEFAULT 0,
    created_at     timestamptz     NOT NULL DEFAULT now(),
    updated_at     timestamptz     NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_id       ON waitlist(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_status            ON waitlist(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at         ON waitlist(joined_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_deleted_at        ON waitlist(deleted_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_notifications_wait ON waitlist_notifications(waitlist_id);

-- ── Triggers ──────────────────────────────────────────────────
DO $$
BEGIN
    -- waitlist updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_waitlist_updated_at') THEN
        CREATE TRIGGER set_waitlist_updated_at
            BEFORE UPDATE ON waitlist
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- waitlist_notifications updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_waitlist_notifications_updated_at') THEN
        CREATE TRIGGER set_waitlist_notifications_updated_at
            BEFORE UPDATE ON waitlist_notifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
