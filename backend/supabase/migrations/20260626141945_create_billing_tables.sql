-- =============================================================
-- Migration: create_billing_tables
-- Description: bills and bill_discounts for Billing Module
-- =============================================================

-- ── bills table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        uuid           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    subtotal        decimal(12,2)  NOT NULL DEFAULT 0,
    tax             decimal(12,2)  NOT NULL DEFAULT 0,
    discount_total  decimal(12,2)  NOT NULL DEFAULT 0,
    total           decimal(12,2)  NOT NULL DEFAULT 0,
    status          text           NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft', 'issued', 'paid', 'refunded')),
    issued_at       timestamptz,
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

-- ── bill_discount table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_discount (
    bill_id         uuid           NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    discount_id     uuid           NOT NULL, -- Link to discount if exists
    amount_saved    decimal(12,2)  NOT NULL DEFAULT 0,
    PRIMARY KEY (bill_id, discount_id)
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bills_order_id     ON bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_status       ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at   ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_deleted_at   ON bills(deleted_at);

-- ── updated_at trigger ────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_bills_updated_at') THEN
        CREATE TRIGGER set_bills_updated_at
            BEFORE UPDATE ON bills
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
