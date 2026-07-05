-- =============================================================
-- Migration: create_demand_forecast_tables
-- Description: Create tables for AI Demand Forecasting and AI Job Logs
-- =============================================================

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create demand_forecast table
CREATE TABLE IF NOT EXISTS demand_forecast (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_date date          NOT NULL,
    menu_item_id  uuid          NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    predicted_qty decimal(10,2) NOT NULL DEFAULT 0.00,
    actual_qty    decimal(10,2) DEFAULT NULL,
    confidence    decimal(5,4)  NOT NULL DEFAULT 0.0000,
    generated_at  timestamptz   NOT NULL DEFAULT now(),
    created_at    timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT unique_item_forecast_date UNIQUE (menu_item_id, forecast_date)
);

-- Create ai_job_log table
CREATE TABLE IF NOT EXISTS ai_job_log (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type          text        NOT NULL, -- 'demand_forecasting'
    status            text        NOT NULL CHECK (status IN ('success', 'failed')),
    records_processed int         NOT NULL DEFAULT 0,
    error_message     text,
    ran_at            timestamptz NOT NULL DEFAULT now(),
    duration_ms       int         NOT NULL DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demand_forecast_created_at ON demand_forecast(created_at);
CREATE INDEX IF NOT EXISTS idx_demand_forecast_date ON demand_forecast(forecast_date);
CREATE INDEX IF NOT EXISTS idx_demand_forecast_menu_item ON demand_forecast(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_ai_job_log_ran_at ON ai_job_log(ran_at);

-- Create triggers for menu_category and menu_item if they don't already exist
-- (as requested by: repeat trigger for menu_item)
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
