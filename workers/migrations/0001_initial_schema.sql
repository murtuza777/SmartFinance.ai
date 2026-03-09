-- BurryAI D1 initial schema
-- Creates core relational tables for auth, financial tracking, analytics, and AI interaction history.

PRAGMA foreign_keys = ON;

-- User accounts and credentials.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One financial profile per user.
CREATE TABLE IF NOT EXISTS financial_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  monthly_income REAL NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  savings_goal REAL NOT NULL DEFAULT 0 CHECK (savings_goal >= 0),
  risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('low', 'moderate', 'high')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- User expenses and spending history.
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  user_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL CHECK (date(date) IS NOT NULL),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Student loans and debt tracking per user.
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  user_id TEXT NOT NULL,
  loan_name TEXT NOT NULL,
  principal_amount REAL NOT NULL CHECK (principal_amount >= 0),
  interest_rate REAL NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
  minimum_payment REAL NOT NULL CHECK (minimum_payment >= 0),
  remaining_balance REAL NOT NULL CHECK (remaining_balance >= 0),
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- AI advisor interactions for auditing and analytics.
CREATE TABLE IF NOT EXISTS ai_logs (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Historical financial scores over time.
CREATE TABLE IF NOT EXISTS financial_scores (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  score_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- AI-generated user recommendations.
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) = 36),
  user_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for per-user query performance and isolation-friendly access patterns.
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id_due_date ON loans(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_scores_user_id ON financial_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- Automatic updated_at maintenance for mutable entities.
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_financial_profiles_updated_at
AFTER UPDATE ON financial_profiles
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE financial_profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_expenses_updated_at
AFTER UPDATE ON expenses
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_loans_updated_at
AFTER UPDATE ON loans
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE loans SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
