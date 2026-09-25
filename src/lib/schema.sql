-- RenameApps schema (Neon Postgres)
-- Run this once against your Neon database, then set DATABASE_URL.

CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) UNIQUE,
  original_name VARCHAR(100) NOT NULL,
  icon_bg VARCHAR(120) NOT NULL DEFAULT 'from-red-500 to-rose-700',
  icon_class VARCHAR(80) NOT NULL DEFAULT 'fa-solid fa-cube',
  category VARCHAR(50) NOT NULL,
  website_url TEXT,
  is_sponsored BOOLEAN DEFAULT FALSE,
  sponsor_tier VARCHAR(20) DEFAULT 'free',
  sponsor_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS renames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  honest_name VARCHAR(120) NOT NULL,
  upvotes INTEGER DEFAULT 1,
  ip_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash VARCHAR(64) NOT NULL,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL, -- 'rename' OR 'upvote'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_app ON rate_limits (ip_hash, app_id, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_created ON rate_limits (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_renames_app ON renames (app_id, upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_apps_category ON apps (category);
