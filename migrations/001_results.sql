CREATE TABLE IF NOT EXISTS test_results (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  product TEXT NOT NULL,
  item_id TEXT NOT NULL,
  tested_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload))
);
CREATE UNIQUE INDEX IF NOT EXISTS test_results_request_id_idx ON test_results(request_id);
CREATE INDEX IF NOT EXISTS test_results_product_item_idx ON test_results(product, item_id, sequence);
