-- =============================================================
-- Migration: create_upsell_pairs
-- Description: Table for AI-driven upsell recommendations
-- =============================================================

CREATE TABLE IF NOT EXISTS upsell_pair (
    id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    item_a_id       uuid           NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    item_b_id       uuid           NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    co_order_count  integer        NOT NULL DEFAULT 0,
    confidence      decimal(5, 4)  NOT NULL DEFAULT 0, -- Store as percentage (0.0000 to 1.0000)
    last_computed   timestamptz    NOT NULL DEFAULT now(),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now(),
    
    -- Ensure we don't have duplicate pairs (A,B)
    CONSTRAINT unique_upsell_pair UNIQUE (item_a_id, item_b_id),
    -- Ensure item_a and item_b are different
    CONSTRAINT different_items CHECK (item_a_id <> item_b_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upsell_pair_item_a ON upsell_pair(item_a_id);
CREATE INDEX IF NOT EXISTS idx_upsell_pair_item_b ON upsell_pair(item_b_id);
CREATE INDEX IF NOT EXISTS idx_upsell_pair_confidence ON upsell_pair(confidence DESC);

-- ── updated_at trigger ───────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_upsell_pair_updated_at') THEN
        CREATE TRIGGER set_upsell_pair_updated_at
            BEFORE UPDATE ON upsell_pair
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ── Function to compute co-occurrence matrix ──────────────────
CREATE OR REPLACE FUNCTION compute_upsell_matrix()
RETURNS void AS $$
BEGIN
    -- Clear old pairs (we recalculate everything from last 90 days)
    TRUNCATE upsell_pair;

    INSERT INTO upsell_pair (item_a_id, item_b_id, co_order_count, confidence)
    WITH OrderPairs AS (
        SELECT 
            oi1.menu_item_id AS item_a_id,
            oi2.menu_item_id AS item_b_id,
            COUNT(DISTINCT oi1.order_id) as pair_count
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.menu_item_id <> oi2.menu_item_id
        JOIN orders o ON oi1.order_id = o.id
        WHERE o.created_at > (now() - interval '90 days')
          AND o.status IN ('confirmed', 'served', 'closed')
          AND o.deleted_at IS NULL
          AND oi1.status <> 'voided'
          AND oi2.status <> 'voided'
        GROUP BY 1, 2
    ),
    ItemCounts AS (
        SELECT 
            menu_item_id,
            COUNT(DISTINCT order_id) as total_orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at > (now() - interval '90 days')
          AND o.status IN ('confirmed', 'served', 'closed')
          AND o.deleted_at IS NULL
          AND oi.status <> 'voided'
        GROUP BY 1
    )
    SELECT 
        op.item_a_id,
        op.item_b_id,
        op.pair_count,
        (op.pair_count::decimal / ic.total_orders) as confidence
    FROM OrderPairs op
    JOIN ItemCounts ic ON op.item_a_id = ic.menu_item_id
    WHERE op.pair_count >= 20; -- Minimum threshold
END;
$$ LANGUAGE plpgsql;
