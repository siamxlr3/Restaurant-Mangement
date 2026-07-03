-- =============================================================
-- CMS TABLES MIGRATION
-- All 12 entities for the Restaurant public landing page CMS
-- =============================================================

-- ---------------------------------------------------------------
-- Shared: updated_at trigger function (if not already defined)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE 'plpgsql';

-- ---------------------------------------------------------------
-- 1. cms_site_config  (singleton — one row)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_site_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name      TEXT NOT NULL DEFAULT '',
    tagline         TEXT NOT NULL DEFAULT '',
    logo_url        TEXT,
    logo_key        TEXT,
    favicon_url     TEXT,
    favicon_key     TEXT,
    primary_color   TEXT NOT NULL DEFAULT '#FF6B35',
    timezone        TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_site_config_created_at ON cms_site_config(created_at);

CREATE TRIGGER set_updated_at_cms_site_config
BEFORE UPDATE ON cms_site_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 2. cms_ticker_items  (orderable list)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_ticker_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text        TEXT NOT NULL,
    dot_color   TEXT NOT NULL DEFAULT '#FF6B35',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_ticker_items_sort_order ON cms_ticker_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_ticker_items_is_active  ON cms_ticker_items(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_ticker_items_created_at ON cms_ticker_items(created_at);

CREATE TRIGGER set_updated_at_cms_ticker_items
BEFORE UPDATE ON cms_ticker_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 3. cms_hero  (singleton — one row)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_hero (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    headline_part1        TEXT NOT NULL DEFAULT '',
    headline_part2        TEXT NOT NULL DEFAULT '',
    subheadline           TEXT NOT NULL DEFAULT '',
    cta_primary_text      TEXT NOT NULL DEFAULT '',
    cta_primary_url       TEXT NOT NULL DEFAULT '',
    cta_secondary_text    TEXT,
    cta_secondary_url     TEXT,
    stat_rating           TEXT NOT NULL DEFAULT '4.7',
    stat_reviews          TEXT NOT NULL DEFAULT '1.2k+',
    stat_years            TEXT NOT NULL DEFAULT '12yr',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_hero_created_at ON cms_hero(created_at);

CREATE TRIGGER set_updated_at_cms_hero
BEFORE UPDATE ON cms_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 4. cms_story  (singleton — one row)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_story (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heading                 TEXT NOT NULL DEFAULT '',
    body_paragraphs         TEXT[] NOT NULL DEFAULT '{}',
    read_more_url           TEXT,
    stat_est_year           TEXT NOT NULL DEFAULT '2014',
    stat_covers_night       TEXT NOT NULL DEFAULT '200+',
    stat_return_guests_pct  TEXT NOT NULL DEFAULT '78%',
    stat_ranking            TEXT NOT NULL DEFAULT '#1',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_story_created_at ON cms_story(created_at);

CREATE TRIGGER set_updated_at_cms_story
BEFORE UPDATE ON cms_story
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 5. cms_featured_dishes  (orderable list, optional FK to menu_item)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_featured_dishes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id    UUID REFERENCES menu_item(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    image_url       TEXT,
    image_key       TEXT,
    price           TEXT NOT NULL DEFAULT '',
    rating          NUMERIC(3,1) NOT NULL DEFAULT 5.0,
    description     TEXT NOT NULL DEFAULT '',
    badge           TEXT CHECK (badge IN ('BESTSELLER', 'CHEF''S SIGNATURE', 'NEW', 'SEASONAL')),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_featured_dishes_menu_item_id ON cms_featured_dishes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_cms_featured_dishes_sort_order   ON cms_featured_dishes(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_featured_dishes_is_active    ON cms_featured_dishes(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_featured_dishes_created_at   ON cms_featured_dishes(created_at);

CREATE TRIGGER set_updated_at_cms_featured_dishes
BEFORE UPDATE ON cms_featured_dishes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 6. cms_features  ("Why choose us" cards, orderable)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_features (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon        TEXT NOT NULL DEFAULT '',
    title       TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_features_sort_order ON cms_features(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_features_is_active  ON cms_features(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_features_created_at ON cms_features(created_at);

CREATE TRIGGER set_updated_at_cms_features
BEFORE UPDATE ON cms_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 7. cms_gallery_items  (orderable list with category filter)
-- ---------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE cms_gallery_category AS ENUM ('Kitchen', 'Plates', 'Dining Room', 'Events');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cms_gallery_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url       TEXT NOT NULL,
    image_key       TEXT,
    category        cms_gallery_category NOT NULL DEFAULT 'Plates',
    caption         TEXT NOT NULL DEFAULT '',
    filename_label  TEXT NOT NULL DEFAULT '',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_gallery_items_category   ON cms_gallery_items(category);
CREATE INDEX IF NOT EXISTS idx_cms_gallery_items_sort_order ON cms_gallery_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_gallery_items_is_active  ON cms_gallery_items(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_gallery_items_created_at ON cms_gallery_items(created_at);

CREATE TRIGGER set_updated_at_cms_gallery_items
BEFORE UPDATE ON cms_gallery_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 8. cms_reviews  (guest reviews, orderable)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_reviews (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote         TEXT NOT NULL,
    author_name   TEXT NOT NULL,
    author_handle TEXT NOT NULL DEFAULT '',
    visit_count   INTEGER NOT NULL DEFAULT 1,
    rating        INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    sort_order    INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_reviews_sort_order ON cms_reviews(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_reviews_is_active  ON cms_reviews(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_reviews_created_at ON cms_reviews(created_at);

CREATE TRIGGER set_updated_at_cms_reviews
BEFORE UPDATE ON cms_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 9. cms_opening_hours  (per-day schedule)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_opening_hours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_label   TEXT NOT NULL,
    open_time   TEXT NOT NULL DEFAULT '12:00 PM',
    close_time  TEXT NOT NULL DEFAULT '11:00 PM',
    is_today    BOOLEAN NOT NULL DEFAULT false,
    is_closed   BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_opening_hours_sort_order ON cms_opening_hours(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_opening_hours_created_at ON cms_opening_hours(created_at);

CREATE TRIGGER set_updated_at_cms_opening_hours
BEFORE UPDATE ON cms_opening_hours
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 10. cms_location  (singleton — one row)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_location (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address         TEXT NOT NULL DEFAULT '',
    parking_info    TEXT NOT NULL DEFAULT '',
    phone           TEXT NOT NULL DEFAULT '',
    lat             NUMERIC(10,7),
    lng             NUMERIC(10,7),
    directions_url  TEXT,
    call_cta        TEXT NOT NULL DEFAULT 'Call us',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_location_created_at ON cms_location(created_at);

CREATE TRIGGER set_updated_at_cms_location
BEFORE UPDATE ON cms_location
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 11. cms_faq_items  (orderable list)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_faq_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_faq_items_sort_order ON cms_faq_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_faq_items_is_active  ON cms_faq_items(is_active);
CREATE INDEX IF NOT EXISTS idx_cms_faq_items_created_at ON cms_faq_items(created_at);

CREATE TRIGGER set_updated_at_cms_faq_items
BEFORE UPDATE ON cms_faq_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- 12. cms_reservation_config  (singleton — one row)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_reservation_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_slots              TEXT[] NOT NULL DEFAULT '{}',
    hold_duration_minutes   INTEGER NOT NULL DEFAULT 15,
    max_party_size          INTEGER NOT NULL DEFAULT 10,
    tables_available_count  INTEGER NOT NULL DEFAULT 20,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_reservation_config_created_at ON cms_reservation_config(created_at);

CREATE TRIGGER set_updated_at_cms_reservation_config
BEFORE UPDATE ON cms_reservation_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
