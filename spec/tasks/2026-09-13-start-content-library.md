---
task: start-content-library
project: Elegantia
kind: operation
created: 2026-09-13
memory_links: []
---
# 新コンテンツを反映してElを起動する
## 目的
マージ後の品質カタログとテンプレートをWebで利用できるようにする。
## 完了条件
専用PostgreSQLの接続設定を確認し、本体で依存取得・build後、Cc testing claimを取りExcubitorから起動する。17860のヘルスとコンテンツ取得を確認してclaimを解放する。設定不足を代替DBで隠さない。
## スコープ (編集可ディレクトリ)
Elegantia本体の実行設定・ビルド成果物。サービス操作はExcubitorのみ。worktreeから起動しない。
