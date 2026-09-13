---
task: direct-tunnel-origin
project: Elegantia
kind: bugfix
created: 2026-09-13
memory_links: []
---

# Tunnel直結URLのOriginを明示許可する

## 目的
利用者が設定したhttps://el.ai-run-do.comでmodule scriptとWebSocketのOrigin拒否を解消する。

## スコープ
excubitor.catalog.yaml、spec/interface/exview.md。

## 完了条件
指定されたOriginを完全一致で許可する。他のOrigin許可を広げない。
反映後に本体をExcubitorから再起動し、Cc claim/releaseを伴ってJS/CSS/API/WebSocketを確認する。
