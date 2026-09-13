---
title: 公開検索とローカル評価
type: feature
service: elegantia
domain: local-evaluation
status: implemented
---

# 公開検索とローカル評価

## 価値と不変条件
EL-LOCAL-01: 公開利用者は単語検索で基準を探せる。プロジェクト・ビルド・環境の自由入力を求めない。
EL-LOCAL-02: 評価・登録プロジェクト・申し送りは公開HTTPから取得・変更できない。
EL-LOCAL-03: ローカル一覧はCc登録プロジェクトを更新降順、同時刻は名前順で10件ずつ表示する。
EL-LOCAL-04: 人間のOK/NGとコメントは試験合否とは別の追記履歴であり、以前の判断を消さない。
EL-LOCAL-05: 調査分析は利用者のローカルLLMで実行し、WebサーバにLLM実行APIは設けない。

## 利用モード
ELEGANTIA_MODEはpublicが既定。localを明示したサーバへlocalhost/127.0.0.1の所有ポートで接続した場合のみローカル機能を許可する。
Origin付き要求は同じローカル許可集合に属する必要がある。公開Hostの要求はlocal設定時にも公開機能だけを提供する。
WebSocketはローカルモード・ローカルHost/Origin・接続元ループバックをすべて要求する。
X-Forwarded-HostやForwardedからローカル権限を判断しない。中継で公開Hostをlocalhostへ書き換えないこと。

## プロジェクトと評価
Ccの所有カタログから接続先を解決し、project-codes/adminのcode/project/updated_atだけを読む。
プロジェクトパス、所属、通知設定をWebへ返さない。Cc接続失敗時は明示エラーとし、架空プロジェクトを作らない。
登録更新時刻とSQLiteの試験記録・人間コメント記録時刻の最大値で並べる。未評価の登録プロジェクトも表示する。
評価のproductキーはCcのproject名と完全一致で対応する。旧記録を自動改名しない。
評価条件は保存済みのbuild/environmentから選択し、ローカルLLMが作成した結果は既存JSONインポートで取り込める。

## 人間の申し送り
プロジェクト・品質項目単位でOK/NGと必須コメントを保存する。これは品質必須達成の証拠を代替しない。
requestIdの同一再送は重複しない。内容違いの再送は409。変更は新IDで追記する。
履歴はsequence降順50件、cursorで追加取得する。本文はReactのテキストとして表示する。

## 画面案内
「調査分析はローカル環境のLLMで実行します。サーバから実行はできません」と表示し、LUDIARS/Elegantiaへ案内する。
