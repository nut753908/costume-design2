# src/rendering/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## レンダリング

- `gradientTexture.ts` — すべての `MeshToonMaterial` の `gradientMap` として使われる、共有の4段階 `DataTexture`(キャッシュされたシングルトン)。これによりすべてのガーメント/ボディが同一のセルシェーディングの帯を共有します。
- `Outline.tsx` — イラスト調のアウトライン: インバーテッドハル(法線を反転させた拡大複製)手法(ジオメトリを複製し、`BackSide` の暗い `MeshBasicMaterial` を約2%拡大して適用)。ポストプロセッシングのパイプラインは使用していません。`ToonMesh.tsx` はメッシュとそのアウトラインを1つのユニットとしてペアにします。
- レンダラーは色をフラットでポスターのような見た目に保つため、`THREE.NoToneMapping` を使用し、環境マップは使用していません。
