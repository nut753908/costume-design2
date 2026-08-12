# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` はグラフ内の**すべてのノード**を走査し、評価結果に(特定のノードタイプに限らず)`geometry` + `material` キーがあるかを確認し、あれば `garmentOutput` の evaluate 出力で指定されたアンカー(`anchor`/`offsetY`)に `ToonMesh` をマウントします。つまり、将来的に評価結果として `{geometry, material, anchor, offsetY}` を返すノードタイプが追加されれば、Scene 側の登録なしに自動的にレンダリングされます。複数の出力ノードが同じアンカーを共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。
