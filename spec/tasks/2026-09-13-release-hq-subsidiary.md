---
task: release-hq-subsidiary
project: Elegantia
kind: configuration
created: 2026-09-13
memory_links: []
---

# Elのリリース告知を本社と担当子会社へ届ける

## 目的
利用者の指定どおり本社・子会社へElのリリース告知を配送する。

## 根拠
RevisorのLUDIARS/Elegantia登録はnotify.releaseにconcordiaを含む。
Concordiaのrelease-published-runtime.tsは本社と担当子会社をdeployment-targets.tsで解決する。
担当子会社の公開範囲・通知設定・実配送は未照合。

## 作業
CcのEl登録、担当子会社のプロジェクト範囲と有効な通知先を照合する。
既存の宛先を保持して必要なEl配送設定を整え、実際のリリースイベントの配送記録を確認する。
存在しないリリースを生成せず、重複イベントを再送しない。

## 完了条件
本社と対象子会社への配送先と実投稿が確認できる。API受付と配送完了を区別する。

## スコープ
Rv→Ccの既存リリース通知とCcの担当子会社設定。無関係な通知先は変更しない。
