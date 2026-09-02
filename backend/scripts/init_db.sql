-- ============================================================
-- Natural Language Data Analyst — Schema Initialization
-- ============================================================
-- Run this as a superuser (e.g., postgres or supabase admin)
-- ============================================================

-- -------------------------------------------------------
-- 1. DROP existing objects for idempotent re-runs
-- -------------------------------------------------------
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -------------------------------------------------------
-- 2. Create Tables
-- -------------------------------------------------------

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    country     VARCHAR(60)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    category    VARCHAR(80)  NOT NULL,
    price       NUMERIC(10,2) NOT NULL,
    stock_qty   INT           NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id            SERIAL PRIMARY KEY,
    user_id       INT           NOT NULL REFERENCES users(id),
    product_id    INT           NOT NULL REFERENCES products(id),
    quantity      INT           NOT NULL DEFAULT 1,
    total_amount  NUMERIC(10,2) NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(id),
    plan        VARCHAR(20)  NOT NULL CHECK (plan IN ('free','basic','pro','enterprise')),
    status      VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','cancelled','expired','trial')),
    started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    renewed_at  TIMESTAMPTZ
);

-- -------------------------------------------------------
-- 3. Indexes for common query patterns
-- -------------------------------------------------------
CREATE INDEX idx_orders_user_id      ON orders(user_id);
CREATE INDEX idx_orders_product_id   ON orders(product_id);
CREATE INDEX idx_orders_created_at   ON orders(created_at);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_subscriptions_plan  ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- -------------------------------------------------------
-- 4. Read-Only Role (for the agent's connection pool)
-- -------------------------------------------------------
DO $$
BEGIN
    -- Create role only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'analyst_readonly') THEN
        CREATE ROLE analyst_readonly WITH LOGIN PASSWORD 'readonly_secure_pass_123';
    END IF;
END
$$;

-- Revoke all privileges first to ensure clean state
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM analyst_readonly;
REVOKE ALL ON SCHEMA public FROM analyst_readonly;

-- Grant schema usage and SELECT-only on all existing tables
GRANT USAGE ON SCHEMA public TO analyst_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst_readonly;

-- Ensure future tables are also accessible (for the current session user)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO analyst_readonly;

-- -------------------------------------------------------
-- 5. Verification
-- -------------------------------------------------------
SELECT 'Schema initialization complete.' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
