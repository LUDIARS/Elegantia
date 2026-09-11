CREATE TABLE IF NOT EXISTS test_results (
  sequence BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL,
  product TEXT NOT NULL,
  item_id TEXT NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS test_results_request_id_idx ON test_results(request_id);
CREATE INDEX IF NOT EXISTS test_results_product_item_idx ON test_results(product, item_id, sequence);
