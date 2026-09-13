---
title: Elegantiaの実行環境
type: setup
service: elegantia
domain: interface
status: implemented
---

# 実行環境

## 公開とローカル

所有カタログのELEGANTIA_MODE=publicが公開検索用の既定設定。
ローカル評価を利用する配備ではExのサービス設定でELEGANTIA_MODE=localを明示し、
本体へhttp://127.0.0.1:17860/で接続する。公開URLからはlocal設定時も評価を取得・変更できない。
ローカル一覧には同じworkspaceのConcordia登録が必要。接続先はConcordia所有カタログから解決する。
調査分析はローカル環境のLLMで実行する。サーバにはLLM実行機能がない。
評価結果の受け渡しは既存の結果JSON形式を使用する。

Node.js 24.17.0、npmを使用する。SQLiteはNode組み込みのnode:sqliteを使用し、外部DBサーバや追加ドライバを必要としない。

既定のDBファイルはプロジェクトルートの.local/elegantia.sqlite。
ELEGANTIA_DATABASE_PATHを設定すると変更でき、相対パスはプロジェクトルートから解決する。
親ディレクトリは起動時に作成する。空のパス、メモリDB、file: URIは拒否する。
書込権限やDB初期化に問題があれば起動を失敗させ、一時データに切り替えない。
旧ELEGANTIA_DATABASE_URLは使用しない。旧DBからの自動移行は行わず、必要な結果はJSON入出力で移送する。

## 構築

プロジェクト本体でnpm ci --ignore-scripts --include=devを実行する。
npm run buildは共有ログ依存の明示ビルド、OKF集約、サーバのTS変換、WebのViteビルドを行う。

npm run typecheckはscripts/prepare-typecheck.mjsでTypeScriptと共有ログ依存を準備して型検査する。
依存が未配置ならnpm_execpath経由でnpm ci --ignore-scripts --include=devを実行する。
依存取得・型検査の失敗は非ゼロ終了する。テストは暗黙実行しない。

## 起動管理

起動・停止・再起動はExcubitor HTTP API経由で、プロジェクト本体フォルダのみから行う。
事前にConcordia testing claim、終了時にreleaseを行う。worktreeからサービスを起動しない。
excubitor.catalog.yamlがポート17860と起動コマンドを所有する。
既定の待受は127.0.0.1であり、公開ネットワークへ直接公開しない。
Excubitorが注入するLUDIARS_ALLOWED_HOSTSをHost許可へ追加する。
カンマ区切りのホスト名に対応し、先頭ドットはドメイン自身とサブドメインを許可する。
直接公開URLはELEGANTIA_PUBLIC_URLで、追加Viewer OriginはELEGANTIA_VIEWER_ORIGINSで完全一致を指定する。
Exが所有カタログの${DOMAIN_ROOT}を展開して両設定を注入する。未展開または不正な公開URLは起動時に拒否する。

SIGINT/SIGTERMでWebSocket、HTTP、SQLite接続、ログを閉じる。
ヘルスチェックはDBへの問い合わせを含む。
SQLiteはローカルディスクで単一サービスから利用する構成とし、ネットワーク共有や複数ホスト間でDBファイルを共有しない。
## SQLiteの回帰確認

明示的に試験が許可された場合、build後にnode --test tests/sqlite.test.mjsで確認する。
永続化・再送・競合時の全体取消・条件別最新結果・UTC順序・履歴ページングを対象とする。
テストは一時DBを使い、稼働DBに書き込まない。実行前後にCc claim/releaseを行う。
