# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Garments` 1つだけをレンダリングします — Body も `bodyGroup` として他14種のガーメントと同じ `<name>Group` ノードで表現されているため(ルート CLAUDE.md 参照)、Body 専用の描画コンポーネントはありません。`Garments.tsx` は `useGraphStore((s) => s.rootEvaluatedResults)`(トップレベル視点で合成した完全なグラフの評価結果、`state/useRootEvaluatedGraph.ts` が書き込む — グループノードの中に入っている間も他のガーメントが消えないよう、`s.nodes`/`s.evaluatedResults` ではなくこちらを見る。詳細は `src/state/CLAUDE.md` の「グループの中に入る」節)を走査しますが、**すべてのエントリではなく、`sceneOutputGeometry<N>`/`sceneOutputMaterial<N>`(`N` は0始まりの連番)という予約キーを持つものだけ**を描画対象にします。このキーは、そのノード(通常は `<name>Group`)の内部に `sceneOutput`(`nodes/definitions/generic/sceneOutput.ts`)が実際に配線されている場合にだけ `groupNodeFactory.ts` の `evaluate()` が転送するもので、`Garments.tsx` はノードの型を問わずこのキーの有無だけを見ます。**1つのグループの中に `sceneOutput` は何個置いてもよく**、見つかった数だけそれぞれ独立した `ToonMesh` としてマウントされます(`nodeId:index` をキーにした React の `key` で区別する)。

各ガーメントの `<name>Group` 自身の通常の評価結果にも `groupOutput` 経由の `geometry`/`material`(グループ間で値を再利用したい場合の汎用ソケット、現在は既定では未使用)が含まれることはありますが、それだけでは描画対象になりません — グループの内部で `sceneOutput` へ明示的に配線して初めて `ToonMesh` がマウントされます(`sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` という予約キー自体も、通常の `geometry`/`material` という汎用ソケット名とは意図的に別名にしてあり、`sceneOutput` を経由していない限り現れません)。**取り付け位置(anchorY/offsetY)はここでは扱いません** — 各ガーメントグループの内部で `garmentPlacement` ノード(それ自身は `numberAdd`+`translate` の2ノードだけの小さなグループノード)が、外部ソケット `anchorY`(ルートの `bodyLayout` 共有ノードが計算したアンカー候補のうち、そのガーメントが使う1つ)と `numberInput`(`offsetYIn`)から受け取った値の合計から実座標を計算し、geometry の頂点そのものを平行移動済みだからです(Blender の Geometry Nodes で位置をジオメトリに焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。複数のガーメントが同じアンカー由来の座標を共有することもでき(top/jacket/scarf などはどれも `bodyLayout` の `shoulderY`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。

## 表示/非表示・単独表示(確認用の表示設定)

`Garments.tsx` は、マウントする各 `ToonMesh` を `state/viewStore.ts` の `isMeshVisible()` で絞り込みます。メッシュの識別子は `<グループのノードid>:<そのグループ内の sceneOutput の通し番号>`(`sceneMeshKey()`、React の key と同じ)で、グループ単位ではなく `sceneOutput` 単位です。`SceneOutputPanel.tsx` の S(単独表示)/H(非表示)ボタンが、メッシュの識別子ごとに操作します。単独表示が1つでもあれば、非表示の設定より優先されます。この状態はグラフの `data` ではなく別ストアのため、永続化・Undo/Redo・Export/プリセットの対象になりません(設計の仕様ではなく確認用の設定)。有効な間は `ViewIndicator.tsx` が3Dビューの隅に常時表示し、「隠したまま忘れる」ことを防ぎます。

3Dビューの右上には `SceneOutputPanel.tsx` が、描画されているメッシュ(`sceneOutput`)を一覧します(`listSceneOutputs()`、トップレベルのノード順、複数のメッシュを持つノードだけ `#通し番号` を添える)。各行の S/H が `viewStore` の状態を1メッシュずつ操作します(ノードグラフ上のカードには表示切り替えボタンは無い)。
