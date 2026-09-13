---
task: local-evaluation-implementation
project: Elegantia
kind: implementation
created: 2026-09-13
memory_links: []
---

# 公開検索とローカルプロジェクト評価を実装する

## 目的
公開Webの入力を単語検索に限定し、評価確認と人間の申し送りをローカルに分離する。

## 完了条件
spec/feature/public-local-evaluation.mdのEL-LOCAL-01〜05を満たす。
Cc登録一覧を更新順10件ずつ表示し、保存済み評価条件を選択できる。
OK/NGとコメントを追記保存し、再送で重複させない。公開APIからは評価データを返さない。
ローカルLLM利用とリポジトリへの案内を画面に表示する。

## スコープ
shared/、src/、web/、migrations/、所有カタログ、docs/、spec/、tests/。

## 検証
型検査とビルド。公開API境界・ローカルアクセス条件・プロジェクト順序・コメント永続化の回帰ケースを用意する。
起動・動作確認は反映後の本体からCc claimとExcubitorを利用する。
