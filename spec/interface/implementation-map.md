---
title: 実装ファイルと契約の対応
type: interface
service: elegantia
domain: interface
status: implemented
---

# 実装ファイルと契約の対応

各ファイルの責務と根拠となる仕様を結ぶ。実行試験の成功を示す表ではない。

| 実装 | 責務 | 契約 |
|---|---|---|
| `shared/catalog.ts` | カタログ構造・ID・分野件数の検証 | [OKF](okf.md) |
| `src/catalog/load.ts` | 配信カタログ読込み | [OKF](okf.md) |
| `scripts/render-catalog.mjs` | 個別MDから検索用データと総覧を生成 | [OKF](okf.md) |
| `shared/results.ts` | 結果・文脈・証拠の入力制約 | [データ](../data/schema.md) |
| `shared/coverage.ts` | 条件一致と過去履歴・最新判定 | [機能](../feature/result-tracking.md) |
| `src/results/validate.ts` | カタログ版・ID・未来時刻の確認 | [機能](../feature/result-tracking.md) |
| `src/db/schema.ts` | Drizzleのテーブル定義 | [データ](../data/schema.md) |
| `src/db/connect.ts` | 接続プール・起動時スキーマ適用・切断 | [運用](../setup/runtime.md) |
| `src/db/repository.ts` | 排他追記・冪等性・履歴照会 | [データ](../data/schema.md) |
| `shared/protocol.ts` | module_requestの形式 | [API](api.md) |
| `src/http/app.ts` | 読取りHTTP・静的配信・共通応答ヘッダ | [API](api.md) |
| `src/http/access.ts` | Host/Originとループバックの境界 | [ExView](exview.md) |
| `src/http/errors.ts` | 利用者向けエラーに整形 | [API](api.md) |
| `src/http/socket.ts` | WebSocket要求検証・書込み・通知 | [API](api.md) |
| `src/runtime/config.ts` | 所有カタログ・環境変数の検証 | [運用](../setup/runtime.md) |
| `src/runtime/logger.ts` | Vestigiumログの生成 | [運用](../setup/runtime.md) |
| `src/server.ts` | 資源の組立てと終了処理 | [運用](../setup/runtime.md) |
| `vite.config.ts` | React/Tailwindの配布物生成 | [運用](../setup/runtime.md) |
| `web/src/main.tsx` | ReactとBrowserRouterの起点 | [ExView](exview.md) |
| `web/src/App.tsx` | 条件・検索・一覧・詳細を集約 | [機能](../feature/result-tracking.md) |
| `web/src/ResultForm.tsx` | 実施結果入力と同一内容の再送ID維持 | [機能](../feature/result-tracking.md) |
| `web/src/History.tsx` | 製品履歴とページング | [機能](../feature/result-tracking.md) |
| `web/src/ImportResults.tsx` | JSON取込確認と進捗 | [API](api.md) |
| `web/src/Policy.tsx` | 共通評価条件の遅延読込み | [OKF](okf.md) |
| `web/src/api.ts` | HTTP取得・保存要求とタイムアウト | [API](api.md) |
| `web/src/viewer.ts` | 検証したViewer接頭辞の適用 | [ExView](exview.md) |
| `web/src/styles.css` | 一覧・詳細の余白、色、幅、フォーカスとレスポンシブ配置 | [機能](../feature/result-tracking.md) |
| `web/src/policy.css` | 共通評価条件の展開と長文表示 | [OKF](okf.md) |
