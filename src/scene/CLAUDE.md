# src/scene/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## シーン組み立て

`Scene.tsx` は `Garments` だけを描画します(Body もガーメントと同じグループノードなので、専用の描画コンポーネントは無い)。`Garments.tsx` は `rootEvaluatedResults` を走査し(グループの中にいても他のノードが消えないよう、`s.nodes`/`s.evaluatedResults` は見ない。`src/state/CLAUDE.md` 参照)、予約キー `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` を持つエントリだけを、見つかった組の数だけ `ToonMesh` として描画します。ノードの型は見ません。取り付け位置はグループの中で頂点に焼き込み済みなので、ここでは扱いません。

## 表示/非表示・単独表示(確認用の表示設定)

表示の切り替えは `sceneOutput` 単位(識別子は `sceneMeshKey()` の `<ノードid>:<通し番号>`)で、単独表示が1つでもあれば非表示より優先します。状態は `state/viewStore.ts` の別ストアにあり、グラフの `data` ではないので、永続化・Undo/Redo・Export/プリセットの対象になりません(確認用の設定)。有効な間は `ViewIndicator.tsx` が3Dビューの隅に表示し、隠したまま忘れるのを防ぎます。
