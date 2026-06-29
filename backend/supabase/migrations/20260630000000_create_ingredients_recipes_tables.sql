-- =============================================================
-- Migration: create_ingredients_recipes_tables
-- Description: Ingredient inventory, recipe builder, and stock
--              adjustment audit log tables
-- =============================================================

-- ── ingredient table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredient (
    id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 varchar(150)  NOT NULL,
    unit                 varchar(50)   NOT NULL,                          -- e.g. g, ml, pcs
    stock_qty            numeric(12,3) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    low_stock_threshold  numeric(12,3) NOT NULL DEFAULT 0,
    avg_daily_usage      numeric(12,3) NOT NULL DEFAULT 0,
    reorder_point        numeric(12,3) NOT NULL DEFAULT 0,
    reorder_qty          numeric(12,3) NOT NULL DEFAULT 0,
    cost_per_unit        numeric(10,4) NOT NULL DEFAULT 0,
    is_active            boolean       NOT NULL DEFAULT true,
    deleted_at           timestamptz,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_ingredient_name UNIQUE (name)
);

-- ── recipe table ──────────────────────────────────────────────
-- Maps menu_item → ingredients with qty_used per portion
CREATE TABLE IF NOT EXISTS recipe (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         uuid          NOT NULL REFERENCES menu_item(id)   ON DELETE CASCADE,
    ingredient_id   uuid          NOT NULL REFERENCES ingredient(id)  ON DELETE CASCADE,
    qty_used        numeric(12,3) NOT NULL CHECK (qty_used > 0),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    updated_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_recipe_item_ingredient UNIQUE (item_id, ingredient_id)
);

-- ── stock_adjustment_log table ────────────────────────────────
-- Audit trail for all manual stock adjustments
CREATE TABLE IF NOT EXISTS stock_adjustment_log (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id   uuid          NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
    delta           numeric(12,3) NOT NULL,     -- positive = add, negative = remove
    reason          text          NOT NULL,     -- 'wastage' | 'spoilage' | 'restock' | 'correction' | 'order_deduction'
    adjusted_by     varchar(100)  NOT NULL DEFAULT 'system',
    created_at      timestamptz   NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ingredient_name         ON ingredient(name)                WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_qty    ON ingredient(stock_qty)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredient_is_active    ON ingredient(is_active)           WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredient_created_at   ON ingredient(created_at)          WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredient_deleted_at   ON ingredient(deleted_at);

CREATE INDEX IF NOT EXISTS idx_recipe_item_id          ON recipe(item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredient_id    ON recipe(ingredient_id);

CREATE INDEX IF NOT EXISTS idx_stock_log_ingredient    ON stock_adjustment_log(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_log_created_at    ON stock_adjustment_log(created_at);

-- ── Triggers ──────────────────────────────────────────────────
DO $$
BEGIN
    -- ingredient updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_ingredient_updated_at') THEN
        CREATE TRIGGER set_ingredient_updated_at
            BEFORE UPDATE ON ingredient
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- recipe updated_at trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_recipe_updated_at') THEN
        CREATE TRIGGER set_recipe_updated_at
            BEFORE UPDATE ON recipe
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
