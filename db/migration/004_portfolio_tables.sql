-- Migration: Portfolio Tables
-- Description: Creates tables for portfolio positions and trade history
-- Date: 2026-01-25

-- ============================================
-- Table: positions
-- Stores active and closed positions
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address TEXT NOT NULL UNIQUE, -- Unique constraint for upsert
  token_symbol TEXT NOT NULL,
  token_name TEXT,
  amount_tokens DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  entry_value_usd DECIMAL(20, 2) NOT NULL,
  current_value_usd DECIMAL(20, 2),
  unrealized_pnl_usd DECIMAL(20, 2),
  unrealized_pnl_pct DECIMAL(10, 4),
  stop_loss_price DECIMAL(20, 8),
  stop_loss_pct DECIMAL(5, 2) DEFAULT 15.0,
  take_profit_1_price DECIMAL(20, 8),
  take_profit_2_price DECIMAL(20, 8),
  time_limit_days INTEGER DEFAULT 7,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, STOP_LOSS_HIT, TIME_LIMIT_REACHED, EMERGENCY_EXIT, MANUAL_CLOSE, COMPLETED
  entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  transaction_signatures JSONB, -- Array of transaction signatures
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if table exists without it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE positions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default';
  END IF;
END $$;

-- Add entry_timestamp if table exists without it (for existing tables)
-- Also handle migration from opened_at to entry_timestamp
DO $$ 
BEGIN
  -- If table has opened_at but not entry_timestamp, copy data and rename
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'opened_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'entry_timestamp'
  ) THEN
    -- Add entry_timestamp column
    ALTER TABLE positions ADD COLUMN entry_timestamp TIMESTAMP WITH TIME ZONE;
    -- Copy data from opened_at
    UPDATE positions SET entry_timestamp = opened_at WHERE entry_timestamp IS NULL;
    -- Set NOT NULL after data is copied
    ALTER TABLE positions ALTER COLUMN entry_timestamp SET NOT NULL;
    ALTER TABLE positions ALTER COLUMN entry_timestamp SET DEFAULT NOW();
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'positions' AND column_name = 'entry_timestamp'
  ) THEN
    -- Table doesn't have either column, add entry_timestamp
    ALTER TABLE positions ADD COLUMN entry_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Indexes for positions (after user_id and entry_timestamp are added)
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_token ON positions(token_address);
CREATE INDEX IF NOT EXISTS idx_positions_entry_timestamp ON positions(entry_timestamp);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(status) WHERE status = 'ACTIVE';

-- ============================================
-- Table: trade_history
-- Stores all buy/sell transactions
-- ============================================
CREATE TABLE IF NOT EXISTS trade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  trade_type TEXT NOT NULL, -- 'BUY' or 'SELL'
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT,
  amount_tokens DECIMAL(20, 8) NOT NULL,
  price_usd DECIMAL(20, 8) NOT NULL,
  value_usd DECIMAL(20, 2) NOT NULL,
  transaction_signature TEXT,
  realized_pnl_usd DECIMAL(20, 2), -- For SELL trades
  realized_pnl_pct DECIMAL(10, 4), -- For SELL trades
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if table exists without it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trade_history' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE trade_history ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default';
  END IF;
END $$;

-- Indexes for trade_history
CREATE INDEX IF NOT EXISTS idx_trade_history_user ON trade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_position ON trade_history(position_id);
CREATE INDEX IF NOT EXISTS idx_trade_history_token ON trade_history(token_address);
CREATE INDEX IF NOT EXISTS idx_trade_history_created ON trade_history(created_at);
CREATE INDEX IF NOT EXISTS idx_trade_history_type ON trade_history(trade_type);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for positions table
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Calculate position P&L
-- ============================================
CREATE OR REPLACE FUNCTION calculate_position_pnl(
  p_entry_value DECIMAL,
  p_current_value DECIMAL
)
RETURNS TABLE(
  pnl_usd DECIMAL,
  pnl_pct DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_current_value - p_entry_value AS pnl_usd,
    CASE 
      WHEN p_entry_value > 0 THEN 
        ((p_current_value - p_entry_value) / p_entry_value) * 100
      ELSE 0
    END AS pnl_pct;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- View: Active Positions Summary
-- ============================================
-- Drop view if exists to avoid conflicts
DROP VIEW IF EXISTS active_positions_summary;

CREATE VIEW active_positions_summary AS
SELECT
  COUNT(*) AS total_positions,
  SUM(entry_value_usd) AS total_cost,
  SUM(current_value_usd) AS total_value,
  SUM(current_value_usd - entry_value_usd) AS total_pnl_usd,
  CASE 
    WHEN SUM(entry_value_usd) > 0 THEN
      ((SUM(current_value_usd) - SUM(entry_value_usd)) / SUM(entry_value_usd)) * 100
    ELSE 0
  END AS total_pnl_pct,
  AVG(unrealized_pnl_pct) AS avg_pnl_pct
FROM positions
WHERE status = 'ACTIVE';

-- ============================================
-- View: Trade History Summary
-- ============================================
-- Drop view if exists to avoid conflicts
DROP VIEW IF EXISTS trade_history_summary;

CREATE VIEW trade_history_summary AS
SELECT
  trade_type,
  COUNT(*) AS trade_count,
  SUM(value_usd) AS total_value,
  SUM(realized_pnl_usd) AS total_realized_pnl,
  AVG(realized_pnl_pct) AS avg_realized_pnl_pct
FROM trade_history
WHERE realized_pnl_usd IS NOT NULL
GROUP BY trade_type;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE positions IS 'Stores all portfolio positions (active and closed)';
COMMENT ON TABLE trade_history IS 'Stores all buy/sell transactions';
COMMENT ON COLUMN positions.status IS 'Position status: ACTIVE, STOP_LOSS_HIT, TIME_LIMIT_REACHED, EMERGENCY_EXIT, MANUAL_CLOSE, COMPLETED';
COMMENT ON COLUMN trade_history.trade_type IS 'Trade type: BUY or SELL';
COMMENT ON COLUMN trade_history.realized_pnl_usd IS 'Realized profit/loss in USD (only for SELL trades)';
