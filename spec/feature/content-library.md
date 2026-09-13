---
title: 設計指針・品質・UXのコンテンツライブラリ
type: feature
service: elegantia
domain: quality-catalog
status: draft
---
# 設計指針・品質・UXのコンテンツライブラリ

## 価値と境界
設計時に任意の指針を検討し、目指す体験を定め、採用した品質項目と証拠へつなぐ。
advisory/、quality/、ux/のMarkdownが正本。プログラム仕様はspec/に残す。
Ludusのゲーム体験・機能定義を正本として参照し、Elには品質への対応を記述する。

## 不変条件
- EL-CONTENT-01: 180品質項目のID・本文・revisionは配置変更で変えない。パスは品質ハッシュの対象外。
- EL-CONTENT-02: アドバイザリーの採否を試験の合否へ変換しない。テンプレートを品質項目数に含めない。
- EL-CONTENT-03: UXの逆引きは目指す体験→機能→品質ID→検証計画。Ludus参照は実在するコミット・パス・機能IDを記録し、未対応を明記する。
- EL-CONTENT-04: APIは登録済みIDからのみ文書を返し、任意のファイルパスを受け取らない。

## 生成と表示
render-catalog.mjsがカテゴリ別の項目から索引・総覧・JSONを生成する。
render-library.mjsがconfig/library.jsonの参照と本文を検査してdata/library.jsonを生成する。
Webは必要時にライブラリを読み込み、種類・全文・品質ID・Ludus機能IDで絞る。
Markdownはテキストとして描画し、HTMLを実行しない。取得失敗には再取得を表示する。
GET /api/library は参照情報と本文、GET /api/library/:id/document はMarkdownを返す。

## 反映
本体へマージ後、依存取得とbuildを行い、Cc claim後にExcubitorから起動する。
試験履歴はローカルSQLiteへ保存する。保存先が利用できなければ明示的に失敗し、一時DBや空データで代用しない。
