-- =============================================================
-- Migration: create_reservation_and_customer_tables
-- Description: Customers and Reservations tables for Host/Ops
-- =============================================================

-- ── status enum (if not exists) ──────────────────────────────
DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('confirmed', 'seated', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── customers table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    name         text           NOT NULL,
    phone        text           NOT NULL,
    email        text,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    
    CONSTRAINT customer_phone_unique UNIQUE (phone)
);

-- ── reservations table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id     uuid           REFERENCES restaurant_table(id) ON DELETE SET NULL,
    customer_id  uuid           NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reserved_at  timestamptz    NOT NULL,
    party_size   int            NOT NULL DEFAULT 2 CHECK (party_size > 0),
    status       reservation_status NOT NULL DEFAULT 'confirmed',
    notes        text,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_phone        ON customers(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name         ON customers(name) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_table_id  ON reservations(table_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_cust_id   ON reservations(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_status    ON reservations(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_date      ON reservations(reserved_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_deleted   ON reservations(deleted_at);

-- ── updated_at triggers ───────────────────────────────────────
DO $$
BEGIN
    -- customer trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_customers_updated_at') THEN
        CREATE TRIGGER set_customers_updated_at
            BEFORE UPDATE ON customers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- reservations trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_reservations_updated_at') THEN
        CREATE TRIGGER set_reservations_updated_at
            BEFORE UPDATE ON reservations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
