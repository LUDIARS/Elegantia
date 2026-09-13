---
title: "UVとテクスチャ配置"
type: feature
service: elegantia
domain: quality-catalog
status: planned
tags: [quality, 3dcg]
x-elegantia:
  id: L30
  category: L
  revision: 2
---

# L30 UVとテクスチャ配置

共通の記号・数値案・比較審査は[評価条件](../assessment-policy.md)を適用する。

## ポイント

UVとテクスチャ配置

## 実装内容

UVの継ぎ目、歪み、テクセル密度、パディング、UDIMと縮小表示を管理する

## 達成しうるUX

表面の模様が形に自然になじみ、寄っても引いても整って見える

## 品質達成要件

意図しない重複・継ぎ目・にじみ・模様伸長0件。最終解像度とミップを含む各表示条件でVを満たす

## 追加達成要件

目立つ面へ適切に解像度を配分し、容量と見た目の精度を両立する
