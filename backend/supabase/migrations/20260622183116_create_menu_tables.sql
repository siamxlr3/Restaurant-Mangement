-- =============================================================
-- Migration: create_menu_tables
-- Description: Menu Categories and Items tables with soft delete and triggers
-- =============================================================

-- Create menu_category table
CREATE TABLE IF NOT EXISTS menu_category (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    sort_order  integer     DEFAULT 0,
    is_active   boolean     DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- Create menu_item table
CREATE TABLE IF NOT EXISTS menu_item (
    id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     uuid           REFERENCES menu_category(id) ON DELETE SET NULL,
    name            text           NOT NULL,
    description     text,
    base_price      decimal(12, 2) NOT NULL DEFAULT 0,
    food_cost       decimal(12, 2) NOT NULL DEFAULT 0,
    is_available    boolean        DEFAULT true,
    image_url       text,
    order_count_30d integer        DEFAULT 0,
    revenue_30d     decimal(12, 2) DEFAULT 0,
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

-- Add indexes for performance and features
CREATE INDEX IF NOT EXISTS idx_menu_category_name ON menu_category(name);
CREATE INDEX IF NOT EXISTS idx_menu_category_created_at ON menu_category(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_category_deleted_at ON menu_category(deleted_at);

CREATE INDEX IF NOT EXISTS idx_menu_item_name ON menu_item(name);
CREATE INDEX IF NOT EXISTS idx_menu_item_category_id ON menu_item(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_created_at ON menu_item(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_item_deleted_at ON menu_item(deleted_at);

-- ── updated_at triggers ──────────────────────────────────────
-- Note: update_updated_at_column() should already exist from previous migrations

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_category_updated_at') THEN
        CREATE TRIGGER set_menu_category_updated_at
            BEFORE UPDATE ON menu_category
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_item_updated_at') THEN
        CREATE TRIGGER set_menu_item_updated_at
            BEFORE UPDATE ON menu_item
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
