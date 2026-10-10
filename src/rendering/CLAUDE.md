# src/rendering/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## レンダリング

- `gradientTexture.ts` — すべての `MeshToonMaterial` の `gradientMap` として使われる、共有の4段階 `DataTexture`(キャッシュされたシングルトン)。これによりすべてのメッシュ(ボディとガーメント)が同一のセルシェーディングの帯を共有します。
- `ToonMesh.tsx` — トゥーンマテリアルのメッシュ1つを描画します。外形線(アウトライン)は描画しません(ポストプロセッシングも使用していません)。
- レンダラーは色をフラットでポスターのような見た目に保つため、`THREE.NoToneMapping` を使用し、環境マップは使用していません。
- **`Lighting.tsx` のライトの強度や色を変えたら、`ToonMaterialFactory.ts` の `BRIGHTEST_BAND_LIGHTNESS` を合わせ直す**。影の色(`shadowColor`)を使うマテリアルは、いちばん明るい段の面の明るさをこの値とみなして「色そのまま」に塗るので、ブラウザで明るい面の画素値を測って決める。
- マテリアルは既定で表面だけを描く。裾の開いたスカートのように裏(内側)が見える形は、`toonShadowMaterial` の `doubleSided` を 1 にする(片面だと奥の内側が抜けて背景が見える)。
