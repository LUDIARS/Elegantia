CREATE TABLE IF NOT EXISTS human_reviews (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  project TEXT NOT NULL,
  item_id TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('OK', 'NG')),
  comment TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS human_reviews_project_item ON human_reviews(project, item_id, sequence DESC);
