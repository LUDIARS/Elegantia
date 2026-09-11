---
title: ExView掲載とURL境界
type: interface
service: elegantia
domain: interface
status: implemented
---

# ExView

所有カタログのviewer.enabled=true、entry_path=/によって掲載を許可する。
入口はExViewの /viewer/?service=elegantia、アプリ配下は /viewer/apps/elegantia/。
ブラウザは注入script[data-excubitor-viewer]のdata-prefixを読みBrowserRouterのbasenameと
API/WebSocketの接頭辞に用いる。直接アクセスでは接頭辞なし。

## Originと認証の前提

ExViewは同じ信頼範囲にある内部アプリの中継。外部からの入口はCloudflare Accessで保護する。
Elegantiaはユーザー単位の認証・権限分離を提供せず、許可されたViewer利用者が試験履歴を共有する。
入口側のAccess保護がない状態でインターネットへ公開しない。

ELEGANTIA_VIEWER_ORIGINSに完全一致のOriginだけを列挙する。
カタログの初期値はローカルExView（所有カタログで確認した17334）と既存のweb/exiv公開Origin。
ExView側の変更時はこの設定を更新する。転送時もOriginを偽装せずサーバで照合する。
CSPのframe-ancestorsはselfと設定されたViewer Originのみ許可する。
サービス本体のHostは自身のループバックに限定する。

## 反映

カタログ掲載は本体へのマージ・反映後にExcubitorの通常の同期対象となる。
この実装セッションでは本体へのコピー・起動・再起動・Viewer動作試験を実施しない。
