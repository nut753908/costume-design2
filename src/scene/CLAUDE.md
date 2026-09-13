# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` は `useGraphStore((s) => s.rootEvaluatedResults)`(トップレベル視点で合成した完全なグラフの評価結果、`state/useRootEvaluatedGraph.ts` が書き込む — グループノードの中に入っている間も他のガーメントが消えないよう、`s.nodes`/`s.evaluatedResults` ではなくこちらを見る。詳細は `src/state/CLAUDE.md` の「グループの中に入る」節)の**すべてのエントリ**を走査し、評価結果に(特定のノードタイプに限らず)`geometry` + `material` キーがあるかを確認し、あれば常に原点(`position` を指定しない)で `ToonMesh` をマウントします。**取り付け位置(anchor/offsetY)はここでは扱いません** — 各ガーメントグループの内部で `garmentPlacement` ノードが、`garmentAnchor` の anchor/offsetY と `geometry/body.ts` の純粋関数から計算した実座標を使って geometry の頂点そのものを平行移動済みだからです(Blender の Geometry Nodes で位置をジオメトリに焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。そのためここで `Garments.tsx` が必要とするのは `geometry`+`material` の2キーだけで、将来的に評価結果としてこの2つを返すノードタイプが追加されれば、Scene 側の登録なしに自動的にレンダリングされます。複数のガーメントが同じアンカー由来の座標を共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。
