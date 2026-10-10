# src/state/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` の `useNodesLite`/`useEdgesLite` は React Flow の揮発性フィールド(position・selected・dragging)を取り除き、それだけが変化したときは**同じ配列参照**を返します(ref にキャッシュした手動の等価性チェック。zustand の `useShallow` は新しくマップしたオブジェクトを一階層しか比べないため、無限レンダーループになる)。`useEvaluatedGraph.ts` はこの配列を `useMemo` に渡すので、再評価はノードの `data` かエッジが変わったときだけ起き、ドラッグ中には起きません(シーン右下の `evaluations: N` で確認できる)。

**落とし穴**: `evaluatedResults` は、`nodesLite`/`edgesLite` が実際に変化したときにしか再計算されません。そのため `evaluatedResults` を別の箇所で null などにリセットすると、同じ参照のグラフを読み込み直したとき(「初期状態」プリセットを2回続けて Load するなど)に null のまま固まり、ガーメントが消えます。`evaluatedResults` を書き込む箇所を増やすときは、この制約を踏まえること。

## 保存データの復元と検証

保存されたグラフには、グループの内部グラフが保存時点の構造のまま残ります(削除されたノードタイプを含みうる)。`validateGraph()` は内部サブグラフまで再帰的に、未登録のノードタイプと循環を検証します。Import JSON・プリセット読み込み・localStorage からの復元(`persist` の `merge`)で使い、失敗した保存データは復元せず初期状態で起動して、元のデータを `costume-design-graph-invalid-backup` へ退避します(復元すると `evaluateGraph()` が例外を投げ、全消去しか手段が無くなるため)。

## 1つの入力ソケットには常に最大1本

`graphStore.ts` の `onConnect`/`dropPickedEdge`(どちらも `connectEdge` を通る)は、同じ `target`/`targetHandle` への既存のエッジを取り除いてから追加します。`isValidConnection` は型と循環しか見ず、`addEdge()` は完全一致しか重複除去しないので、これが無いと2本が共存します。evaluator は最初のエッジしか使わないため、後から繋いだ方が静かに無視されます。エッジを直接 `set({ edges })` する経路を増やすなら、この置き換えも通すこと。

例外は `SocketDef.multiple` の入力で、置き換えずに追加します。エッジ配列の並びが結合順になり、`slot` を渡すとその位置へ挿入します。

## Undo/Redo

`past`/`future` のスナップショット(`{nodes, edges, scopeStack}`)を持ち、すべての変更操作は `set()` の前に `pushHistory(key?, coalesceMs?)` を呼びます。

- 同じ `key` で `coalesceMs` 以内に続く呼び出し(スライダーのドラッグ、エッジとノードの連続削除)は1件にまとめる。ノードのドラッグ移動は `dragging` の立ち上がりで1件に区切る。
- スナップショットは `scopeStack` を含むので、階層を跨いで Undo/Redo すると表示中の階層も戻る(入る/出る自体は履歴を積まない)。`_historyKey` は階層を移るたびにリセットし、階層ごとに重複しうるノード id でまとめ処理が階層を跨がないようにしている。
- 履歴は永続化しないので、リロード後は Undo できない(初期状態へは「初期状態(デフォルト)」プリセットで戻す)。

## グループの中に入る(スコープ切り替え)とトップレベル評価パイプライン

`enterGroup()` は現在の `nodes`/`edges` を `scopeStack` へ退避し、ストアの `nodes`/`edges` をそのグループの内部グラフへ**丸ごと差し替えます**。`exitGroup()` は内部グラフを親ノードの `data` へ書き戻します。これにより既存の編集アクションは、今どの階層にいるかを意識せずにそのまま使えます。`removeGroupIOSocket()` だけは、親ノード側の外部エッジも消すために `scopeStack` のフレームへ触れます。

**落とし穴**: グループの中にいる間、`state.nodes`/`state.edges` はその階層の内部だけです。`s.nodes`/`s.edges` を直接読むコードを書くと、中に入った瞬間に他のガーメントが3Dビューから消える、リロードで他の設計が失われる、といった壊れ方をします。**トップレベルの完全なグラフが必要な箇所は `composeRootGraph(scopeStack, nodes, edges)` を経由すること**:

- `selectors.ts` の `useRootGraphLite()`: 合成後のグラフを参照を安定させて返す。
- `useRootEvaluatedGraph.ts`: それを評価して `rootEvaluatedResults` に書く(`App.tsx` で常時マウント)。
- `Garments.tsx`: `rootEvaluatedResults` を走査する。
- `persist` の `partialize`: 合成後のグラフを保存する(`scopeStack` は保存しないので、リロード後はトップレベルに戻る)。

評価パイプラインは2本並行して走ります。今見えている階層の値が欲しいなら `evaluatedResults`(ノードカードの値表示など)、シーン全体のように常にトップレベルが必要なら `rootEvaluatedResults` を使うこと。

## 初期状態とプリセット

`initialGraph.ts` は `bodyGroup` とガーメント(`camisoleDressGroup`)を TypeScript のリテラルで持ちます。座標は持たず、読み込み時に `computeAutoLayout()` で求めます。各ノードのそばのコメントが設計意図なので、編集時は合わせて見直してください。

プリセットは `scope` を持ちます。トップレベルでは `scope` なし(グラフ全体)、グループの中ではそのグループの型名で、同じ型の内部グラフだけを保存・読み込みします。グループの中の「初期状態(デフォルト)」は、そのグループのテンプレートです。
