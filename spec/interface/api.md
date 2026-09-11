---
title: HTTPとWebSocket契約
type: interface
service: elegantia
domain: interface
status: implemented
---

# HTTPとWebSocket

HTTPは同一originの読取りのみ。GET /api/healthはDB疎通を含み、不通なら503。

| GET経路 | 内容 |
|---|---|
| /api/catalog | 版付きカタログ |
| /api/policy | 共通評価条件Markdownを含むJSON |
| /api/catalog.md | 全文Markdown |
| /api/items/:id/document | 個別OKF Markdown |
| /api/contexts | 保存済み製品・ビルド・環境 |
| /api/overview?product=&build=&environment= | 現在条件の一覧・集計 |
| /api/items/:id/results?product=&cursor= | 50件単位の製品履歴 |
| /api/results/export?product=&build=&environment= | 条件の全履歴JSON |

未知ID404、入力不正400、DB障害500。エラー本文に秘密や内部スタックを返さない。
結果本文中のHTMLはReactのテキストとして表示し、証拠はHTTP(S)リンクのみ許可する。

## WebSocket /ws

要求は `{type:"module_request",requestId:UUID,action,payload}`。
actionはrecord_result（単一ResultInput）またはimport_results（schemaVersion:1,results配列）。
結果自体のrequestIdが冪等性キーで、外側requestIdは応答の対応付け。
成功応答はmodule_response、requestId、ok:true、count。
失敗はok:falseとerror。保存後results_changed/productを接続中クライアントへ送る。
1接続の同時書込は禁止、受信上限1MiB、1バッチ500件。
ブラウザは15秒で保存応答を打ち切るが、未保存とは断定せず履歴確認・同一ID再送を案内する。

ResultInputの正本はshared/results.ts。context、itemId、itemRevision、catalogVersion、
verdict、testedAt、procedure、notes、evidence、additionalAchieved、requestIdを必須とする。
証拠URLの到達性・証拠自体の正しさは自動判定しない。

## 接続境界

直接待受は127.0.0.1。HostとOriginをallowlistで確認する。
ExView連携は[別契約](exview.md)。任意Originや外部Hostへの開放は行わない。
