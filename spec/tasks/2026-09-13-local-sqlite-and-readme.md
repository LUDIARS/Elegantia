---
task: local-sqlite-and-readme
project: Elegantia
kind: implementation
created: 2026-09-13
memory_links: []
---

# ローカルSQLite保存と製品READMEの整理

## 目的

専用DBサーバなしで試験履歴を永続化し、トップREADMEを審美眼ツールの説明へ集約する。

## スコープ

src/db/、src/runtime/、src/server.ts、migrations/、config/、package.json、package-lock.json、.env.example、.gitignore、README.md、docs/、spec/、tests/。

## 完了条件

既定の.local/elegantia.sqliteへ保存し、再起動後も読み出せる。
再送の冪等性、競合時のバッチ全体ロールバック、条件別最新結果と履歴ページングを維持する。
PostgreSQL・Drizzle依存を除去する。READMEからサーバ機能・立ち上げ方を別文書へリンクし、ExViewの説明をトップへ載せない。

## 関連する起動作業

2026-09-13-start-content-library.mdの起動目的を引き継ぐ。
その文書のPostgreSQL接続前提は、ユーザーのSQLite指定により本タスクのローカルDB前提に置き換える。
起動確認は反映後の本体でCc claimとExcubitorを使用する。