-- ====================================================================
-- SmartSave AI — Supabase PostgreSQL Database Schema
-- Migration: 20261009000000_smartsave_schema.sql
-- Description: Complete schema for stores, profiles, products, sales,
--              pricing_recommendations, waste_records, inventory_events,
--              and activity_logs with Row Level Security (RLS) policies.
-- ====================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Profiles Table (linked to auth.users if Supabase Auth is active)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Store Manager', 'Operations Lead', 'Shift Supervisor', 'Sustainability Officer')),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Store Members (Role-based access per store)
CREATE TABLE IF NOT EXISTS store_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Operations Lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, user_id)
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Produce', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood', 'Deli & Prepared', 'Pantry & Dry Goods')),
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    cost_price NUMERIC(10, 2) NOT NULL CHECK (cost_price >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    original_price NUMERIC(10, 2) NOT NULL CHECK (original_price >= 0),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    shelf_life_days INTEGER NOT NULL DEFAULT 7,
    sales_velocity NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, sku)
);

-- 6. Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity_sold NUMERIC(10, 2) NOT NULL CHECK (quantity_sold > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    revenue NUMERIC(12, 2) NOT NULL CHECK (revenue >= 0),
    sold_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Pricing Recommendations Table
CREATE TABLE IF NOT EXISTS pricing_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    recommended_price NUMERIC(10, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    estimated_sell_through NUMERIC(5, 2) NOT NULL,
    estimated_revenue_recovered NUMERIC(10, 2) NOT NULL,
    explanation TEXT NOT NULL,
    confidence VARCHAR(20) NOT NULL DEFAULT 'Moderate',
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Waste Records Table
CREATE TABLE IF NOT EXISTS waste_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity_wasted NUMERIC(10, 2) NOT NULL CHECK (quantity_wasted > 0),
    unit VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(10, 2) NOT NULL CHECK (estimated_cost >= 0),
    reason VARCHAR(100) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Inventory Events Table
CREATE TABLE IF NOT EXISTS inventory_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('RESTOCK', 'PRICE_CHANGE', 'WASTE_DISPOSAL', 'DONATION', 'EXPIRY_ALERT')),
    quantity NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast operations & queries
CREATE INDEX IF NOT EXISTS idx_products_store_expiry ON products(store_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(store_id, category);
CREATE INDEX IF NOT EXISTS idx_sales_store_sold_at ON sales(store_id, sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_rec_pending ON pricing_recommendations(store_id, status);
CREATE INDEX IF NOT EXISTS idx_waste_records_store ON waste_records(store_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_store ON activity_logs(store_id, created_at DESC);

-- Row Level Security (RLS) Configuration
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Default Policies (allow authenticated users with valid store membership)
CREATE POLICY "Store members can view products"
    ON products FOR SELECT
    USING (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

CREATE POLICY "Store managers and staff can modify products"
    ON products FOR ALL
    USING (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

CREATE POLICY "Store members can view recommendations"
    ON pricing_recommendations FOR SELECT
    USING (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

CREATE POLICY "Store members can view activity logs"
    ON activity_logs FOR SELECT
    USING (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

-- ====================================================================
-- Initial Seed Data: Realistic Demo Store & Catalog
-- ====================================================================
INSERT INTO stores (id, name, location, currency, currency_symbol)
VALUES ('00000000-0000-0000-0000-000000000001', 'GreenOak Harvest Market', 'Downtown Flagship, Seattle', 'USD', '$')
ON CONFLICT (id) DO NOTHING;
