---
title: 品質項目OKFとWeb集約の契約
type: interface
service: elegantia
domain: quality-catalog
status: implemented
---

# 品質項目OKF

## 正本

1項目1ファイル、`spec/quality/items/C01.md` のように安定IDで配置する。
AIFormatのOKFに合わせてYAML frontmatterにtitle、type: feature、service: elegantia、domain、status、tagsを置く。
`x-elegantia` にid、category、revisionを持たせる。statusは文書のライフサイクルであり試験の判定ではない。
本文H1はIDと名称、H2は次の5つだけをこの順序で必須とする。

1. ポイント
2. 実装内容
3. 達成しうるUX
4. 品質達成要件
5. 追加達成要件

全見出しを空にしない。YAML titleとポイント本文を一致させる。
内容変更時はrevisionを増やす。IDの再利用は禁止する。
カテゴリー定義と期待件数はconfig/catalog.jsonが所有する。

## 集約

scripts/render-catalog.mjsが全個別MDを読み、書式・ID・見出し順・件数を確認して生成する。
data/catalog.jsonはWeb配信のための派生データで、別の編集正本にしない。
spec/quality/index.mdは分野別リンク一覧、catalog.mdは全項目を5見出しで並べた総覧。
カタログ版は基底版と全内容のSHA-256短縮ハッシュで識別する。
生成はbuild時の明示処理。HTTP GETでは書込みを行わない。

## Web

本文の全フィールドとIDを検索対象とする。分野と結果状態の絞り込みを組み合わせる。
各項目の詳細から元のOKF Markdownをダウンロードできる。
