# Elegantia — エレガンティア

「標準以下を出さない」を、共有できる観点と試験の証拠にする品質管理サービスです。
アクションゲーム、3DCG、ハイグラフィックを中心に180項目を収録しています。

- 共通体験30、アクション45、3DCG40、グラフィック50、審美眼15。
- 3DCGは造形・リグ・アニメーション・素材・撮影・合成・納品を扱い、リアルタイムとオフラインの双方に対応します。
- [個別OKF Markdownの索引](spec/quality/index.md)。各項目は同じ5見出しで記述。
- Webで全項目を集約。全5フィールド横断検索、分野・試験状態で絞り込み。
- 製品／ビルド／環境ごとに、結果なし・過去条件のみ・現在の結果を区別。
- 手順、日時、証拠URL、判定、追加達成を履歴として保存。JSON入出力に対応。
- ExViewのサービス一覧・埋め込み・配下URLに対応。

## セットアップ

Node 24.17.x、npm、専用PostgreSQLデータベースが必要です。
このリポジトリの公開はソース公開です。実際の試験データは専用DBに保存し、Gitに含めません。

1. プロジェクト本体で `npm ci --ignore-scripts --include=dev`。
2. `.env.example` を参考に `ELEGANTIA_DATABASE_URL` を設定。
3. `npm run typecheck`、`npm run build`。
4. 起動の許可取得後、Concordiaのtesting claimを登録し、Excubitor経由で本体フォルダから起動。完了時にrelease。

ポートは所有カタログ `excubitor.catalog.yaml` の **17860**。
直接URLは **http://127.0.0.1:17860/**。
ExViewの選択経路は `/viewer/?service=elegantia`。
この変更ではサービス起動、DB接続試験、ブラウザ試験、デプロイを実行していません。

## 基準の編集

正本は `spec/quality/items/<ID>.md`。共通書式は[OKF契約](spec/interface/okf.md)を参照してください。
`npm run catalog:docs` は個別MDからWeb用JSON、分野別索引、全文総覧を生成します。
生成JSONを直接編集しないでください。本文を変えたら項目revisionを上げて再生成します。
内容のハッシュをカタログ版に含めるため、旧基準の試験結果を新基準の合格へ自動昇格させません。

## 利用

Webの最初の3欄に対象条件を入力すると試験状況が表示されます。
項目を選択して5部構成の内容を読み、結果を記録します。
必須達成には証拠URLが必要です。非該当・試験中断・未確認には理由を残します。
過去履歴は上書き・削除せず、訂正は新しい記録として追加します。

記録があることと品質達成は別です。証拠の内容は人が確認します。
本サービスはゲームを自動実行したり、URL先の証拠を自動審査したりしません。

## 運用と設計

- [機能](spec/feature/result-tracking.md) / [データ](spec/data/schema.md) / [API](spec/interface/api.md)
- [ExView](spec/interface/exview.md) / [セットアップ](spec/setup/runtime.md) / [未実施の試験計画](spec/test/acceptance.md)
- Hono / React / TypeScript / PostgreSQL / Drizzle / WebSocket / Vestigium。
- 固定コミットのVestigiumを依存として取得し、build:sharedで明示的にビルドします。
- 認証はExViewのCloudflare Access境界を前提とする個人向け構成です。直接待受は127.0.0.1のみです。
