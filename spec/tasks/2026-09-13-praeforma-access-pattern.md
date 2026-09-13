---
task: praeforma-access-pattern
project: Elegantia
kind: bugfix
created: 2026-09-13
memory_links: []
---

# Praeformaの配備URL・Host注入方式へ合わせる

## 目的
直接公開URLをViewer追加Originへ個別追記する処置をやめ、Pfと同じ配備設定の分離を採用する。

## 作業
PfのVite設定、サーバconfig、local-access、所有カタログを照合する。
Exが展開するELEGANTIA_PUBLIC_URLから直接公開HostとHTTPS Originを導出する。
LUDIARS_ALLOWED_HOSTSをViteと本番HTTP/WebSocketで解釈する。
追加Viewer OriginとWebSocket接続元制限を維持する。

## 完了条件
ExのDOMAIN_ROOT変更に追従する。公開URLを追加Viewer一覧へ手動追記する必要がない。
不正URL・未許可Originを拒否し、ローカル利用を維持する。
参照したPf実装と対応関係を仕様に残す。

## スコープ
src/runtime/、vite.config.ts、excubitor.catalog.yaml、spec/、tests/。
