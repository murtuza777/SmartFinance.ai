PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT,
  country TEXT,
  student_status TEXT,
  university TEXT,
  onboarding_completed INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_completed IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

CREATE TRIGGER IF NOT EXISTS trg_user_profiles_updated_at
AFTER UPDATE ON user_profiles
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE user_profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
END;
