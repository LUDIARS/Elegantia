# 審査checkoutでTypeScriptコンパイラを起動できない

- Date: 2026-09-11
- Status: fixed in working tree / review pending
- Area: Revisor TypeScript static check

## Evidence

PR #1701、head 5e4f96c、2026-09-11 11:16 UTCの登録チェックがexit 1。
pretypecheck → build:sharedで「tscがコマンドとして認識されない」と終了。
型検査の診断が出る前の失敗。開発worktreeでは依存導入後の型検査が成功していた。

## Cause

登録コマンドが独立した審査checkoutの依存準備を担当しておらず、PATH上のtscを前提としていた。
ログから直接確定できるのはtsc未解決。依存未配置とPATH差の両方を処理する。

## Fix Requirements

依存未配置ならロックファイルからdevDependenciesを含めて取得する。
依存のライフサイクルスクリプトは実行しない。ローカルコンパイラをnodeで直接呼ぶ。
失敗を合格へ変換せず、既存の型検査対象と共有ライブラリのビルドを維持する。

## Verification

ローカル型検査で修正後のコマンドを確認する。独立checkoutでの結果は再審査待ち。
単体・統合・起動テストは実行しない。非ブロックのAnatomia所見は本修正で解消済みと扱わない。
