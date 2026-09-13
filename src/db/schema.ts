/** SQLite row contract. DDL is owned by migrations/001_results.sql. */
export interface ResultRow {
  sequence: number;
  recorded_at: string;
  payload: string;
}