---
title: Elegantiaの実行環境
type: setup
service: elegantia
domain: interface
status: implemented
---

# 実行環境

Node 24.17.x、npm、PostgreSQLの専用データベースを用意する。
接続文字列は環境変数ELEGANTIA_DATABASE_URLで渡す。実際の認証情報はリポジトリに置かない。
初回起動のDBユーザーにはスキーマ作成権限が必要。
バックアップはPostgreSQL側で管理し、稼働データをソース公開に混ぜない。

依存取得はnpm ci --ignore-scripts --include=dev。
npm run buildは共有ログ依存の明示ビルド、OKF集約、サーバのTS変換、WebのViteビルドを行う。
npm run typecheckは共有ログ依存をビルドして型検査を行う。
## 審査checkoutの型検査準備

scripts/prepare-typecheck.mjsはTypeScriptまたは共有ログ依存が未配置なら、
npm_execpath経由でnpm ci --ignore-scripts --include=devを実行する。
package-lock.jsonを使用し、インストールスクリプトを実行しない。
その後nodeでローカルのtypescript/bin/tscを直接呼び、PATH上のtscに依存しない。
依存取得失敗・タイムアウト・型検査失敗は非ゼロ終了し、検査をスキップしない。

依存installスクリプトや単体・起動テストを暗黙実行しない。

起動・停止・再起動はExcubitor HTTP API経由、プロジェクト本体フォルダのみ。
worktreeからサービスを起動しない。事前にConcordia testing claim、終了時releaseを行う。
本体カタログがポート17860、起動コマンド、ExView設定を所有する。
アクセスはループバックとAccess保護されたExViewを前提とするため、
この版で外部向けNginx・コンテナ公開や独立認証を追加しない。
Redisを必要とするキャッシュ・キューはない。永続状態はPostgreSQLに集約する。

SIGINT/SIGTERMでWebSocket、HTTP、DBプール、ログを閉じる。
ヘルスチェックはDBへの問い合わせを含む。
稼働未確認。端末のNode 24.14.1での型検査・ビルドと目標Nodeでの動作確認を区別する。
