-- =============================================================
-- Migration: create_payments_table
-- Description: payments table for Billing Module
-- =============================================================

-- ── payments table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id          uuid           NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    method           text           NOT NULL CHECK (method IN ('cash', 'card', 'split')),
    amount           decimal(12,2)  NOT NULL DEFAULT 0,
    reference_number text,          -- For card payments
    received_amount  decimal(12,2)  DEFAULT 0, -- For cash payments
    change_amount    decimal(12,2)  DEFAULT 0, -- For cash payments
    status           text           NOT NULL DEFAULT 'completed'
                                    CHECK (status IN ('completed', 'refunded')),
    refund_reason    text,
    paid_at          timestamptz    NOT NULL DEFAULT now(),
    created_at       timestamptz    NOT NULL DEFAULT now(),
    updated_at       timestamptz    NOT NULL DEFAULT now(),
    deleted_at       timestamptz
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_bill_id     ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at  ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at  ON payments(deleted_at);

-- ── updated_at trigger ────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_payments_updated_at') THEN
        CREATE TRIGGER set_payments_updated_at
            BEFORE UPDATE ON payments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
