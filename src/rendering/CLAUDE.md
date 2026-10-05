# src/rendering/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## レンダリング

- `gradientTexture.ts` — すべての `MeshToonMaterial` の `gradientMap` として使われる、共有の4段階 `DataTexture`(キャッシュされたシングルトン)。これによりすべてのガーメント/ボディが同一のセルシェーディングの帯を共有します。
- `ToonMesh.tsx` — トゥーンマテリアルのメッシュ1つを描画します。外形線(アウトライン)は描画しません(ポストプロセッシングも使用していません)。
- レンダラーは色をフラットでポスターのような見た目に保つため、`THREE.NoToneMapping` を使用し、環境マップは使用していません。
- `ToonMaterialFactory.ts` — `createToonMaterial(color, shadowColor?)`。`shadowColor` を渡すと、明るい面は `color` そのままの色、影の面は明るさ(受けた光 / `color` の輝度)に応じて `shadowColor` へ寄る色になる(`onBeforeCompile` で標準のトゥーンのシェーダーの `outgoingLight` を差し替える)。いちばん明るい段の面が持つ明るさ `BRIGHTEST_BAND_LIGHTNESS` を「色そのまま」とみなすので、`Lighting.tsx` のライトの強度や色を変えたら、ブラウザで明るい面の画素値を測って合わせ直すこと。渡さなければ標準の `MeshToonMaterial` のまま(色に段ごとの灰色の係数を掛けて暗くする)。ノードは `toonShadowMaterial`、影の色は `shadeColor`(色に R・G・B の倍率を掛ける)で作る。ボディと全ガーメントが使う(`garmentOutput()` が `shadeColor` と `toonShadowMaterial` を生成。影の色の倍率は各グループの中の `shade` ノードの入力欄で、服ごとに変えられる)。
