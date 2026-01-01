-- User table (Synced from Stripe)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- Stripe Customer ID
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free',      -- 'free' | 'pro'
  stripe_subscription_id TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,                  -- Stripe Customer ID (or null for anonymous)
  content_url TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- View for monthly usage count
CREATE VIEW IF NOT EXISTS monthly_usage AS
SELECT user_id, COUNT(*) as count
FROM usage
WHERE created_at > unixepoch() - 2592000  -- 30 days
GROUP BY user_id;
