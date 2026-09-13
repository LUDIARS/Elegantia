---
title: 品質カタログと試験履歴
type: data
service: elegantia
domain: results
status: implemented
---

# データ所有

## 人間の申し送り

migrations/002_human_reviews.sqlがhuman_reviewsを追加する。
sequence主キー、request_id一意、project/item_id、OK/NG、comment、recorded_atを所有する。
試験結果の合否と分離し、切り替え時は新しい行を追記する。コメントもGit管理対象外のSQLiteに保存する。
起動時はmigrations内の番号付きSQLを名前順で排他トランザクション内に適用する。各DDLは再適用可能にする。

| データ | 正本 | 保護 |
|---|---|---|
| 品質基準 | 個別OKF Markdown | Gitレビュー・版管理 |
| 検索用カタログ | Markdownから生成したJSON | 再生成可能 |
| 試験結果・証拠参照 | ローカルSQLite | Git管理対象外、DBバックアップ |
| 稼働ログ | Vestigium JSONL | 結果本文・秘密・URLを記録しない |

## test_results

sequenceはINTEGER PRIMARY KEY AUTOINCREMENT、request_idは一意なTEXT。
product、item_id、tested_at、recorded_at、payloadはTEXT。payloadにはjson_valid制約を置く。
payloadはshared/results.tsのZodスキーマで検証する。product/item/sequence索引で履歴を取得する。
カタログはファイル所有のためDB外部キーは置かず、アプリ境界でIDを照合する。

書込はBEGIN IMMEDIATEで直列化し、バッチ全体をコミットまたはロールバックする。
同一requestId・同一内容は再挿入せず、異なる内容は競合として拒否する。
tested_atは比較用にUTCへ正規化し、payloadには入力を保持する。recorded_atはサーバが生成する。
最新結果は製品内の項目・ビルド・環境・項目revision・カタログ版ごとに実施日時を優先し、同時刻ならsequenceで決める。
履歴はsequence降順で50件ずつ取得する。修正・削除APIは提供しない。

## 接続と初期化

Node組み込みSQLiteを使用する。WAL、synchronous=FULL、busy_timeout=5000で開く。
同期SQL処理中にawaitを挟まず、単一接続のトランザクションをリクエスト間で混在させない。
小規模ローカル利用を対象とし、インポートは最大500件とする。
migrations/001_results.sqlを起動時の排他トランザクションで適用する。
初期スキーマはCREATE IF NOT EXISTSで再適用可能。将来の変更は新規マイグレーションとして追加する。

## バックアップと移送

JSONエクスポートは選択条件の全履歴をrequestId付きで保存する。
インポートでもIDを維持し、競合内容を拒否する。recordedAt/sequenceは移送先で再付番する。
旧カタログ版の結果も保存できるが、不明な項目IDは取り込まない。
以前のPostgreSQLから自動でデータを読む機能はない。旧環境からエクスポートしたJSONを取り込む。

全体の復旧用バックアップはサービスを正常停止してから取得する。
設定されたSQLiteファイルと、残っている-wal/-shmファイルを同じ時点の組として保管する。
稼働中に本体ファイルだけコピーしない。復旧は停止中に同じ組を戻し、異なる世代の付随ファイルを混ぜない。
DBとバックアップは個人データを含むためGitへ追加しない。
