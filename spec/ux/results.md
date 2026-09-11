---
title: 試験結果の存在を確かめる
type: feature
ux_definition: 1
id: UX-ELEGANTIA-RESULTS
service: elegantia
domain: results
ux_scope: core-domain
product_ux: spec/ux/product.md
status: draft
owner: product-owner
---
# 試験結果
コアドメイン。品質担当者がUX-W1/W2/W3を達成するため、条件付きの結果と根拠を保持する。
項目版・製品・ビルド・環境が一致した記録だけを現在の結果とする。
同じ条件では実施日時と連番で最新を決める。全履歴を保存する。
無効な入力と再送衝突は保存せず具体的な理由を返す。試験自体の実行は責務外。
評価は結果登録、別ビルドへの変更、過去結果の表示、保存失敗からの再試行で確認する。現状は未測定。
