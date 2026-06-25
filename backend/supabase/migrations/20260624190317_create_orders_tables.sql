-- =============================================================
-- Migration: create_orders_tables
-- Description: orders, order_items, order_item_modifiers for POS
-- =============================================================

-- ── orders table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id     uuid           REFERENCES restaurant_table(id) ON DELETE SET NULL,
    customer_id  uuid,
    type         text           NOT NULL CHECK (type IN ('dine-in', 'takeaway', 'delivery')),
    status       text           NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','confirmed','preparing','ready','served','closed')),
    hold_reason  text,
    void_reason  text,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now(),
    deleted_at   timestamptz
);

-- ── order_items table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     uuid           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id uuid           NOT NULL REFERENCES menu_item(id) ON DELETE RESTRICT,
    variant_id   uuid           REFERENCES menu_variant(id) ON DELETE SET NULL,
    quantity     int            NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price   decimal(12,2)  NOT NULL,
    status       text           NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','voided')),
    notes        text,
    created_at   timestamptz    NOT NULL DEFAULT now(),
    updated_at   timestamptz    NOT NULL DEFAULT now()
);

-- ── order_item_modifiers table ────────────────────────────────
CREATE TABLE IF NOT EXISTS order_item_modifiers (
    order_item_id  uuid          NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id    uuid          NOT NULL REFERENCES menu_modifier(id) ON DELETE RESTRICT,
    extra_price    decimal(12,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (order_item_id, modifier_id)
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_table_id    ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type         ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at   ON orders(deleted_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id       ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id   ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status         ON order_items(status);

CREATE INDEX IF NOT EXISTS idx_order_item_modifiers_item  ON order_item_modifiers(order_item_id);

-- ── updated_at triggers ───────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_orders_updated_at') THEN
        CREATE TRIGGER set_orders_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_order_items_updated_at') THEN
        CREATE TRIGGER set_order_items_updated_at
            BEFORE UPDATE ON order_items
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
