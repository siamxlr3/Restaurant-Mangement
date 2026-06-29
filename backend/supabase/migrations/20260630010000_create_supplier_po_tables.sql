-- =============================================================
-- Migration: create_supplier_po_tables
-- Description: Create supplier, purchase_order, and purchase_order_item tables
-- =============================================================

-- ── supplier table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 varchar(150)  NOT NULL,
    contact              text,                                                -- Phone, email, address, etc.
    lead_time_days       integer       NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
    is_active            boolean       NOT NULL DEFAULT true,
    deleted_at           timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_supplier_name UNIQUE (name)
);

-- ── purchase_order table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id          uuid          NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
    staff_id             uuid          REFERENCES staff(id) ON DELETE SET NULL,
    ai_suggested         boolean       NOT NULL DEFAULT false,
    ordered_at           timestamptz,
    status               varchar(50)   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received')),
    deleted_at           timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now()
);

-- ── purchase_order_item table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_order_item (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id    uuid          NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
    ingredient_id        uuid          NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
    qty                  numeric(12,3) NOT NULL CHECK (qty > 0),
    unit_cost            numeric(10,4) NOT NULL CHECK (unit_cost >= 0),
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_po_item_ingredient UNIQUE (purchase_order_id, ingredient_id)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_supplier_name         ON supplier(name)                WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_is_active    ON supplier(is_active)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_created_at   ON supplier(created_at)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_deleted_at   ON supplier(deleted_at);

CREATE INDEX IF NOT EXISTS idx_po_supplier_id        ON purchase_order(supplier_id)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_status             ON purchase_order(status)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_created_at         ON purchase_order(created_at)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_po_deleted_at         ON purchase_order(deleted_at);

CREATE INDEX IF NOT EXISTS idx_poi_po_id             ON purchase_order_item(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_ingredient_id     ON purchase_order_item(ingredient_id);

-- ── Triggers ──────────────────────────────────────────────────
DO $$
BEGIN
    -- supplier updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_supplier_updated_at') THEN
        CREATE TRIGGER set_supplier_updated_at
            BEFORE UPDATE ON supplier
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- purchase_order updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_purchase_order_updated_at') THEN
        CREATE TRIGGER set_purchase_order_updated_at
            BEFORE UPDATE ON purchase_order
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- purchase_order_item updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_purchase_order_item_updated_at') THEN
        CREATE TRIGGER set_purchase_order_item_updated_at
            BEFORE UPDATE ON purchase_order_item
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
