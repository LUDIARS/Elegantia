# UXテンプレート

作りたい機能の列挙から始めず、目指す体験を定めて、必要な機能・品質要件・確認方法へ逆引きします。

- [空のテンプレート](templates/目指す体験から逆引きする.md)
- [アクション：意図した操作が届く](examples/アクションで意図した操作が届く.md)
- [Web：待たされず次の判断へ進める](examples/待たされず次の判断へ進める.md)

## Ludusとの役割分担

Ludusの `spec/data/game-template/<genre>/ux/` はゲームの体験設計、`feature/` と `game-lexicon` は機能と語彙の正本です。
Elegantiaは目指す体験から、その正本と品質項目・証拠への対応を管理します。Ludus本文をコピーして独立編集しません。

`config/library.json` にLudusのrepository・revision・path・genre・featureIdsと、ElのqualityIdsを保持します。
生成後の `/api/library` から同じ対応を取得でき、Webでは参照コミットの正本を開けます。
今回の参照版は `ccd38ccbb55d8871cffb40198cfa8beb62af1b42`。Ludusの内容変更時は差分を確認して参照版と対応を更新します。
これは参照とエクスポートによる連携であり、Ludus側への自動登録・双方向同期は行いません。
