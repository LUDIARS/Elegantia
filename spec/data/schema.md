---
title: 品質カタログと試験履歴
type: data
service: elegantia
domain: results
status: implemented
---

# データ所有

| データ | 種別 | 正本 | 保護 |
|---|---|---|---|
| 品質基準 | 公開マスター | 個別OKF Markdown | Gitレビュー・版管理 |
| 検索用カタログ | 派生 | buildで生成したJSON | 再生成可能 |
| 試験結果・証拠参照 | 利用者データ | PostgreSQL | ソース公開と分離、DBバックアップ |
| DB接続情報 | 秘密 | 環境変数 | Git管理禁止 |
| 稼働ログ | 運用ログ | Vestigium JSONL | 結果本文・秘密・URLを記録しない |

## test_results

sequence BIGSERIAL主キー、request_id UUID一意、product TEXT、item_id TEXT、
tested_atとrecorded_at TIMESTAMPTZ、payload JSONB。
payloadはshared/results.tsのZodスキーマで検証した結果全体。
product/item/sequence索引で履歴を取得する。カタログはファイル所有のためDB外部キーは置かず、
アプリ境界でIDを照合する。

保存はDBトランザクション内の共有advisory lockで直列化し、同時再送を二重挿入しない。
実施日時はUTCへ正規化。記録日時はサーバが生成する。書込後の修正・削除APIは提供しない。
マイグレーションはmigrations/001_results.sqlを起動時の排他トランザクションで適用する。
この初期スキーマはCREATE IF NOT EXISTS。将来の変更は新規マイグレーションとして追加する。

## バックアップ

JSONエクスポートは選択条件の全履歴をrequestId付きで保存する。
インポート時もIDを維持し、既存結果と競合する内容は拒否する。
recordedAt/sequenceはDB固有なのでJSON移送では再付番。DB全体の完全復旧はPostgreSQLバックアップを使う。
旧カタログ版の結果も保存できるが、不明IDの記録は取り込まない。
