-- =============================================================
-- Migration: create_analytics_tables
-- Description: Create tables for sales reports, menu performance,
--              inventory cost, and anomaly alerts.
-- =============================================================

-- ── 1. Create update_updated_at_column function ──────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ── 2. Create tables ──────────────────────────────────────────

-- Create sale_report table
CREATE TABLE IF NOT EXISTS sale_report (
    id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    period_label       varchar(50)    NOT NULL UNIQUE,
    total_revenue      decimal(12, 2) NOT NULL DEFAULT 0,
    subtotal_revenue   decimal(12, 2) NOT NULL DEFAULT 0,
    total_tax          decimal(12, 2) NOT NULL DEFAULT 0,
    total_discounts    decimal(12, 2) NOT NULL DEFAULT 0,
    total_orders       integer        NOT NULL DEFAULT 0,
    avg_order_value    decimal(12, 2) NOT NULL DEFAULT 0,
    dine_in_count      integer        NOT NULL DEFAULT 0,
    takeaway_count     integer        NOT NULL DEFAULT 0,
    delivery_count     integer        NOT NULL DEFAULT 0,
    dine_in_revenue    decimal(12, 2) NOT NULL DEFAULT 0,
    cash_collected     decimal(12, 2) NOT NULL DEFAULT 0,
    card_collected     decimal(12, 2) NOT NULL DEFAULT 0,
    bkash_collected    decimal(12, 2) NOT NULL DEFAULT 0,
    void_count         integer        NOT NULL DEFAULT 0,
    refund_total       decimal(12, 2) NOT NULL DEFAULT 0,
    created_at         timestamptz    NOT NULL DEFAULT now(),
    updated_at         timestamptz    NOT NULL DEFAULT now()
);

-- Create menu_performence table
CREATE TABLE IF NOT EXISTS menu_performence (
    id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id       uuid           REFERENCES menu_item(id) ON DELETE SET NULL,
    item_name          varchar(150)   NOT NULL,
    category_name      varchar(150),
    total_qty_sold     integer        NOT NULL DEFAULT 0,
    total_revenue      decimal(12, 2) NOT NULL DEFAULT 0,
    avg_unit_price     decimal(12, 2) NOT NULL DEFAULT 0,
    food_cost          decimal(12, 2) NOT NULL DEFAULT 0,
    total_food_cost    decimal(12, 2) NOT NULL DEFAULT 0,
    gross_profit       decimal(12, 2) NOT NULL DEFAULT 0,
    margin_pct         decimal(5, 2)  NOT NULL DEFAULT 0,
    revenue_share_pct  decimal(5, 2)  NOT NULL DEFAULT 0,
    rank               integer        NOT NULL DEFAULT 0,
    category_revenue   decimal(12, 2) NOT NULL DEFAULT 0,
    is_slow_mover      boolean        NOT NULL DEFAULT false,
    created_at         timestamptz    NOT NULL DEFAULT now(),
    updated_at         timestamptz    NOT NULL DEFAULT now()
);

-- Create inventory_cost table
CREATE TABLE IF NOT EXISTS inventory_cost (
    id                        uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id             uuid           REFERENCES ingredient(id) ON DELETE SET NULL,
    ingredient_name           varchar(150)   NOT NULL,
    unit                      varchar(50)    NOT NULL,
    current_stock_qty         numeric(12,3)  NOT NULL DEFAULT 0,
    cost_per_unit             numeric(10,4)  NOT NULL DEFAULT 0,
    current_stock_value       decimal(12,2)  NOT NULL DEFAULT 0,
    qty_purchased             numeric(12,3)  NOT NULL DEFAULT 0,
    purchase_cost             decimal(12,2)  NOT NULL DEFAULT 0,
    qty_consumed_theoretical  numeric(12,3)  NOT NULL DEFAULT 0,
    qty_consumed_actual       numeric(12,3)  NOT NULL DEFAULT 0,
    wastage_qty               numeric(12,3)  NOT NULL DEFAULT 0,
    wastage_value             decimal(12,2)  NOT NULL DEFAULT 0,
    ai_suggested_pos          integer        NOT NULL DEFAULT 0,
    supplier_name             varchar(150),
    created_at                timestamptz    NOT NULL DEFAULT now(),
    updated_at                timestamptz    NOT NULL DEFAULT now()
);

-- Create anomaly_alerts table
CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    feature        varchar(100)   NOT NULL,
    type           varchar(100)   NOT NULL,
    headline       text           NOT NULL,
    body           text           NOT NULL,
    cta_label      varchar(100),
    cta_href       text,
    confidence     decimal(5, 2)  NOT NULL DEFAULT 0.00,
    payload        jsonb          NOT NULL DEFAULT '{}'::jsonb,
    is_read        boolean        NOT NULL DEFAULT false,
    is_dismissed   boolean        NOT NULL DEFAULT false,
    generated_at   timestamptz    NOT NULL DEFAULT now()
);

-- ── 3. Add Indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sale_report_created_at ON sale_report(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_performence_created_at ON menu_performence(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_cost_created_at ON inventory_cost(created_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_generated_at ON anomaly_alerts(generated_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_is_read ON anomaly_alerts(is_read);

-- ── 4. Setup triggers for updated_at ─────────────────────────
DO $$
BEGIN
    -- Ensure trigger on menu_category exists
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_category_updated_at') THEN
        CREATE TRIGGER set_menu_category_updated_at
            BEFORE UPDATE ON menu_category
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Ensure trigger on menu_item exists
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_item_updated_at') THEN
        CREATE TRIGGER set_menu_item_updated_at
            BEFORE UPDATE ON menu_item
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger for sale_report
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_sale_report_updated_at') THEN
        CREATE TRIGGER set_sale_report_updated_at
            BEFORE UPDATE ON sale_report
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger for menu_performence
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_performence_updated_at') THEN
        CREATE TRIGGER set_menu_performence_updated_at
            BEFORE UPDATE ON menu_performence
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Trigger for inventory_cost
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_inventory_cost_updated_at') THEN
        CREATE TRIGGER set_inventory_cost_updated_at
            BEFORE UPDATE ON inventory_cost
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
