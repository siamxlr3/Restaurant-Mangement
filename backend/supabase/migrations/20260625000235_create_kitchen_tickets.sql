-- ── updated_at trigger function ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ── kitchen_ticket table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS kitchen_ticket (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    station      text           NOT NULL,
    status       text           NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'preparing', 'ready', 'bumped')),
    sent_at      timestamptz    NOT NULL DEFAULT now(),
    bumped_at    timestamptz,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kitchen_ticket_order_id ON kitchen_ticket(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_ticket_status   ON kitchen_ticket(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_ticket_station  ON kitchen_ticket(station);
CREATE INDEX IF NOT EXISTS idx_kitchen_ticket_created_at ON kitchen_ticket(created_at);

-- ── updated_at triggers ───────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_kitchen_ticket_updated_at') THEN
        CREATE TRIGGER set_kitchen_ticket_updated_at
            BEFORE UPDATE ON kitchen_ticket
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
