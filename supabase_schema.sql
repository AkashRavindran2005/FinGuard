-- Supabase SQL Schema for FinGuard
-- Run this in the Supabase SQL Editor

-- 1. Create Portfolios Table
CREATE TABLE portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  total_value FLOAT8 DEFAULT 100000.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Only one portfolio per user for this hackathon
  CONSTRAINT unique_user_portfolio UNIQUE (user_id)
);

-- 2. Create Assets Table
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  weight FLOAT8 NOT NULL,
  buy_price FLOAT8 NOT NULL,
  current_price FLOAT8,
  quantity INT4 NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One ticker per portfolio
  CONSTRAINT unique_portfolio_asset UNIQUE (portfolio_id, ticker)
);

-- 3. Create Rules Table
CREATE TABLE rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  threshold FLOAT8 NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  trigger_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (Security best practice)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own data
CREATE POLICY "Users can view own portfolio" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio" ON portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolio" ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Assets inherit RLS largely from joining, but here's direct user validation
CREATE POLICY "Users manage own assets" ON assets 
FOR ALL USING (
  portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
);

-- Rules RLS
CREATE POLICY "Users can manage own rules" ON rules FOR ALL USING (auth.uid() = user_id);
