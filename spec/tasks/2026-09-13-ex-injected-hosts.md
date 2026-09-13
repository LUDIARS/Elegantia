---
task: ex-injected-hosts
project: Elegantia
kind: bugfix
created: 2026-09-13
memory_links: []
---

# Ex経由のHost拒否を修正する

## 目的
Excubitor共通のLUDIARS_ALLOWED_HOSTS注入に対応し、許可されたEx経由のアクセスを通す。

## 完了条件
HTTPとWebSocketでカンマ区切り・先頭ドット規約を解釈する。
未許可Host、不正なHost、似た別ドメインを拒否する。
Origin完全一致とWebSocket接続元ループバック制限を維持する。

## スコープ
src/runtime/、src/http/access.ts、src/http/socket.ts、src/server.ts、spec/、tests/。

## 検証
型検査、Hostの境界条件とWebSocketのOrigin・接続元制限の回帰ケースを用意する。
反映後は本体をExcubitorから再起動し、Cc claim/releaseを伴ってEx経由の利用を確認する。
