# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` は `useGraphStore((s) => s.rootEvaluatedResults)`(トップレベル視点で合成した完全なグラフの評価結果、`state/useRootEvaluatedGraph.ts` が書き込む — グループノードの中に入っている間も他のガーメントが消えないよう、`s.nodes`/`s.evaluatedResults` ではなくこちらを見る。詳細は `src/state/CLAUDE.md` の「グループの中に入る」節)を走査しますが、**すべてのエントリではなく、`sceneOutput`(`nodes/definitions/sceneOutput.ts`)へ実際に配線されているものだけ**を描画対象にします。これは2つの経路のどちらかです:

1. トップレベルに置いた `sceneOutput` 型のノード自身(`useRootGraphLite()` でトップレベル視点のノード一覧を別途引き、`type === 'sceneOutput'` の id 集合でフィルタする)— その評価結果の `geometry`/`material` をそのまま使う。
2. `<name>Group` の埋め込みサブグラフの中に `sceneOutput` を置いた場合 — `groupNodeFactory.ts` の `evaluate()` がその評価結果を `sceneOutputGeometry`/`sceneOutputMaterial` という予約キーへ転送済みなので、ノードの型を問わずこの2キーの有無だけを見る。

各ガーメントの `<name>Group` 自身の通常の評価結果にも `geometry`+`material` は既に含まれています(グループ内部の `groupOutput` から転送されるため)が、それだけでは描画対象になりません — 上記1か2のどちらかで `sceneOutput` へ明示的に配線して初めて `ToonMesh` がマウントされます。これは「型が `geometry`+`material` を持っていれば自動描画される」という以前の暗黙の検出から、「`sceneOutput` への配線そのものが描画の仕様になる」という明示的な形に変更したものです(`sceneOutputGeometry`/`sceneOutputMaterial` という予約キー自体も、通常の `geometry`/`material` という汎用ソケット名とは意図的に別名にしてあり、`sceneOutput` を経由していない限り現れない — `numberDisplay` が `outputs: []` としながら `value` キーを返すのと同じ「配線された明示的な出口だけが特別なキーを持つ」パターン)。**取り付け位置(anchor/offsetY)はここでは扱いません** — 各ガーメントグループの内部で `garmentPlacement` ノードが、`enumInput`/`numberInput`(`anchorIn`/`offsetYIn`)から受け取った anchor/offsetY と `geometry/body.ts` の純粋関数から計算した実座標を使って geometry の頂点そのものを平行移動済みだからです(Blender の Geometry Nodes で位置をジオメトリに焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。複数のガーメントが同じアンカー由来の座標を共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。トップレベルの `<name>Output` とグループ内部の `sceneOutput` の両方を同時に配線すると、同じガーメントが2つの `ToonMesh` として二重に描画される点に注意してください(両方とも独立に「明示的に配線されている」ため、仕様通りの挙動です)。
