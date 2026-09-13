# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` は `useGraphStore((s) => s.rootEvaluatedResults)`(トップレベル視点で合成した完全なグラフの評価結果、`state/useRootEvaluatedGraph.ts` が書き込む — グループノードの中に入っている間も他のガーメントが消えないよう、`s.nodes`/`s.evaluatedResults` ではなくこちらを見る。詳細は `src/state/CLAUDE.md` の「グループの中に入る」節)を走査しますが、**すべてのエントリではなく、`sceneOutputGeometry`/`sceneOutputMaterial` という予約キーを持つものだけ**を描画対象にします。この2キーは、そのノード(通常は `<name>Group`)の内部に `sceneOutput`(`nodes/definitions/sceneOutput.ts`)が実際に配線されている場合にだけ `groupNodeFactory.ts` の `evaluate()` が転送するもので、`Garments.tsx` はノードの型を問わずこの2キーの有無だけを見ます。

各ガーメントの `<name>Group` 自身の通常の評価結果にも `groupOutput` 経由の `geometry`/`material`(グループ間で値を再利用したい場合の汎用ソケット、現在は既定では未使用)が含まれることはありますが、それだけでは描画対象になりません — グループの内部で `sceneOutput` へ明示的に配線して初めて `ToonMesh` がマウントされます。これは「型が `geometry`+`material` を持っていれば自動描画される」という以前の暗黙の検出から、「`sceneOutput` への配線そのものが描画の仕様になる」という明示的な形に変更したものです(`sceneOutputGeometry`/`sceneOutputMaterial` という予約キー自体も、通常の `geometry`/`material` という汎用ソケット名とは意図的に別名にしてあり、`sceneOutput` を経由していない限り現れない — `numberDisplay` が `outputs: []` としながら `value` キーを返すのと同じ「配線された明示的な出口だけが特別なキーを持つ」パターン)。**取り付け位置(anchor/offsetY)はここでは扱いません** — 各ガーメントグループの内部で `garmentPlacement` ノードが、`enumInput`/`numberInput`(`anchorIn`/`offsetYIn`)から受け取った anchor/offsetY と `geometry/body.ts` の純粋関数から計算した実座標を使って geometry の頂点そのものを平行移動済みだからです(Blender の Geometry Nodes で位置をジオメトリに焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。複数のガーメントが同じアンカー由来の座標を共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。
