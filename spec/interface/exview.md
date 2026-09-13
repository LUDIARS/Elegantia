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
Tunnel直結はExから注入するELEGANTIA_PUBLIC_URLを読み、完全一致のHTTPS Originとして許可する。
module scriptとWebSocketも同じOrigin判定を使う。未設定ならローカルと追加Viewer Originのみ許可する。
カタログではhttps://el${DOMAIN_ROOT}を定義し、Exのドメイン正本から展開する。
直接公開URLはHost許可にも追加する。Hostの共通許可からOriginのワイルドカード許可は生成しない。
カタログの初期値はローカルExView（所有カタログで確認した17334）と既存のweb/exiv公開Origin。
ExView側の変更時はこの設定を更新する。転送時もOriginを偽装せずサーバで照合する。
CSPのframe-ancestorsはselfと設定されたViewer Originのみ許可する。
Hostは自身のループバックとExcubitorが注入するLUDIARS_ALLOWED_HOSTSで判定する。
共通設定はカンマ区切りのホスト名。先頭ドットはそのドメインとサブドメインを許可する。
HTTPとWebSocketで同じHost許可を使う。Hostの許可はOriginの許可へ自動展開しない。
WebSocketのOrigin完全一致と接続元ループバック制限を維持する。
参考: Excubitor/frontend/config.ts、Excubitor/spec/faq/allowedhosts-global-env.md。

## Praeformaとの対応

参照コミット: e894e88c942b4f835096e9eb3a12ca41101bd524。
Praeforma/web/vite.config.tsと同様、ViteにもLUDIARS_ALLOWED_HOSTSを注入する。
Praeforma/server/src/config.tsとlib/local-access.tsに倣い、公開URLと追加Originを分離する。
PfのPRAEFORMA_PUBLIC_URLに相当する設定がELEGANTIA_PUBLIC_URL。
PfのPRAEFORMA_ALLOWED_ORIGINSに相当する既存設定がELEGANTIA_VIEWER_ORIGINS。
公開URLに対するHostとOriginを同じ配備設定から導出し、利用者ごとのドメインをアプリ本体へ直書きしない。

## 反映

カタログ掲載は本体へのマージ・反映後にExcubitorの通常の同期対象となる。
この実装セッションでは本体へのコピー・起動・再起動・Viewer動作試験を実施しない。
