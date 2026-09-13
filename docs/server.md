# Elegantia Webサービス

[審美眼ツールの説明へ戻る](../README.md)

## 機能

- 180項目を一覧にまとめ、5部構成の本文を横断検索。分野・試験状態で絞り込む。
- アドバイザリー・クォリティ・UXテンプレートを検索し、Markdownを保存する。
- 製品・ビルド・環境を指定し、結果なし・過去条件のみ・現在の結果を区別する。
- 手順、日時、証拠URL、判定、追加達成を履歴に記録する。
- JSONで試験結果をエクスポート・インポートする。

必須達成には証拠URLが必要です。非該当・試験中断・未確認には理由を残します。訂正は新しい記録として追加し、過去履歴を上書きしません。

UXテンプレートはLudusの機能定義と参照コミットに接続します。参照と設計情報の記述を扱い、Ludusへの自動同期は行いません。

## 立ち上げ方

Node.js 24.17.0とnpmを使用します。試験履歴はローカルSQLiteに保存し、DBサーバの準備は不要です。

1. プロジェクト本体で `npm ci --ignore-scripts --include=dev` を実行します。
2. `npm run build` で配信用ファイルを生成します。
3. 起動前にConcordiaのtesting claimを登録し、Excubitorから本体フォルダのElegantiaを起動します。確認後にreleaseします。

ポートの正本は [excubitor.catalog.yaml](../excubitor.catalog.yaml) です。現在の直接アクセス先は http://127.0.0.1:17860/ です。待受は127.0.0.1に限定しています。

設定・起動管理の詳細は[実行環境](../spec/setup/runtime.md)を参照してください。

## データ保存

既定の保存先は本体の `.local/elegantia.sqlite` です。変更する場合だけ `ELEGANTIA_DATABASE_PATH` を設定します。相対パスはプロジェクトルートを基準とします。DBファイルと付随するWALファイルはGit管理対象外です。

条件単位の移送にはJSON入出力を使います。全履歴をバックアップする場合はサービスを正常停止してからDBと残存する付随ファイルを一緒に保管します。稼働中のDBファイルだけをコピーしないでください。詳細は[データ所有と復旧](../spec/data/schema.md)を参照してください。

## コンテンツの編集

正本は `quality/items/<カテゴリID>-<カテゴリ名>/<ID>-<タイトル>.md` です。[OKF契約](../spec/interface/okf.md)に従って編集します。

`npm run catalog:docs` でWeb用JSON、索引、全文総覧、テンプレート集を生成します。生成JSONは直接編集しません。品質本文を変更したら項目revisionを上げます。旧基準の結果は新基準の合格へ自動昇格しません。

## 設計資料

- [試験履歴の機能](../spec/feature/result-tracking.md)
- [テンプレート集](../spec/feature/content-library.md)
- [API](../spec/interface/api.md)
- [受入確認計画](../spec/test/acceptance.md)