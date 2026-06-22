-- =============================================================
-- Migration: create_variants_modifiers
-- Description: Variants and Modifiers tables for menu items
-- =============================================================

-- Create menu_variant table
CREATE TABLE IF NOT EXISTS menu_variant (
    id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid           NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    label       text           NOT NULL,
    extra_price decimal(12, 2) NOT NULL DEFAULT 0,
    created_at  timestamptz    NOT NULL DEFAULT now(),
    updated_at  timestamptz    NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- Create menu_modifier table
CREATE TABLE IF NOT EXISTS menu_modifier (
    id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     uuid           NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    name        text           NOT NULL,
    extra_price decimal(12, 2) NOT NULL DEFAULT 0,
    is_required boolean        NOT NULL DEFAULT false,
    created_at  timestamptz    NOT NULL DEFAULT now(),
    updated_at  timestamptz    NOT NULL DEFAULT now(),
    deleted_at  timestamptz
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_variant_item_id ON menu_variant(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_variant_deleted_at ON menu_variant(deleted_at);

CREATE INDEX IF NOT EXISTS idx_menu_modifier_item_id ON menu_modifier(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_modifier_deleted_at ON menu_modifier(deleted_at);

-- ── updated_at triggers ──────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_variant_updated_at') THEN
        CREATE TRIGGER set_menu_variant_updated_at
            BEFORE UPDATE ON menu_variant
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_modifier_updated_at') THEN
        CREATE TRIGGER set_menu_modifier_updated_at
            BEFORE UPDATE ON menu_modifier
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
