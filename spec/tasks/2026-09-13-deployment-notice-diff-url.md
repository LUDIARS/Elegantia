---
task: deployment-notice-diff-url
project: Elegantia
kind: bugfix
created: 2026-09-13
memory_links: []
---

# Elのデプロイ告知に差分と公開URLを載せる

## 目的
デプロイ通知の差分取得失敗を解消し、Exにfrontend_urlがあり公開可能ならURLを付記する。

## 根拠
Concordia/src/deploy/service-deployed.tsは差分未取得時に反映のみと通知する。
service-deployed-runtime.tsはRevisorのリポ一覧からIDを引きchanges APIを呼ぶが、非成功応答はnullになる。
現行通知eventにはfrontend_urlがない。El所有カタログへfrontend_urlを追加する変更と連携する。

## 作業
Elの実デプロイのfrom/toとRevisor応答を照合し、実際の失敗原因を特定する。
初回・同一コミット・不明な旧SHA・通信失敗を区別し、取得できた差分を通知へ反映する。
Exの現行所有カタログからURLを取得し、公開可否を既存の公開範囲設定に従って判定する。
秘密・認証情報・内部向けURLを公開告知へ漏らさず、公開可能なfrontend_urlを付記する。

## 完了条件
Elの実デプロイで差分と公開URLが正しく表示される。差分未取得は理由を識別できる。
初回・取得失敗・非公開・URLなしのケースで誤告知しない。

## スコープ
実装先はConcordiaのdeploy連携。必要に応じExcubitorのevent契約を照合する。各対象repoでclaimと専用worktreeを使う。
