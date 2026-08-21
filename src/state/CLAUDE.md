# src/state/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) は React Flow の揮発性フィールド(position、selected、dragging)を取り除き — これが重要な点ですが — それらの揮発性フィールドのみが変化した場合には**同一の配列参照**を返します。これは ref にキャッシュした手動の等価性チェックによるものです(最初に試した zustand の `useShallow` ではありません。これは新しくマップされたオブジェクトに対して一階層のみの `Object.is` 比較を行うため、無限レンダーループを引き起こしました)。`state/useEvaluatedGraph.ts` はこれらの安定した参照を持つ配列を `useMemo(() => evaluateGraph(...))` に渡すため、ジオメトリ/マテリアルの再計算はノードの*データ*やエッジが実際に変化したときにのみ発生し、ドラッグ中やフレームごとには発生しません。これはシーンペイン右下に表示される `evaluations: N` カウンターで実際に確認できます。

この参照安定化ロジックの核である `sameNodes`/`sameEdges`/`toGraphNode`/`toGraphEdge` は純粋関数として `selectors.test.ts` で直接テストしているが、`useNodesLite`/`useEdgesLite` フック自体(useMemo/useRef + ストア購読の配線)も vitest + jsdom + `@testing-library/react` の `renderHook` で end-to-end に検証している(同ファイル内の「(フック)」describe ブロック)。`useBodyScale` も同様に `useBodyScale.test.ts` でフックごとテストしている。ルートの CLAUDE.md 参照。

**落とし穴**: `Garments.tsx` は evaluator の結果を `useEvaluatedGraph()` の戻り値からではなく、`useGraphStore((s) => s.evaluatedResults)` でストアから直接読む。この値を埋め戻すのは `useEvaluatedGraph.ts` の `useEffect(() => setEvaluatedResults(evaluated), [evaluated])` だけであり、その `evaluated` は上記の参照安定化を経た `nodesLite`/`edgesLite` が実際に変化したときにしか再計算されない。かつて `graphStore.ts` の `loadGraph` は呼ばれるたびに `evaluatedResults: null` を無条件にセットしていたが、渡された `nodes`/`edges` が現在の state と**同一参照**の場合(例: `initialNodes`/`initialEdges` のような module-level singleton を保持する「初期状態」プリセットを2回連続で Load する)、ストアの `nodes`/`edges` が変化しないため `nodesLite`/`edgesLite` も再計算されず、`evaluatedResults` が null のまま固まってガーメントが消える、という分かりにくいバグになっていた(修正前に実際に発生していた)。`loadGraph` は現在この null リセットを行わず、`nodes`/`edges` が実際に変化した場合にのみ上記の通常のリアクティブな経路で `evaluatedResults` が再計算されるのに任せている。`evaluatedResults` を書き込む箇所を増やす場合、この「未変化なら再計算されない」制約を踏まえること。

## onConnect: 1つの入力ソケットには常に最大1本

`state/graphStore.ts` の `onConnect` は、新しいエッジを追加する前に同じ `target`/`targetHandle` への既存のエッジを取り除く。`isValidConnection`(`editor/NodeEditor.tsx`)は型の一致と循環の有無しかチェックしないため、これを onConnect 側でやらないと、既に接続済みの入力ソケットへ別のノードから繋いでも(`@xyflow/react` の `addEdge()` は source/target/両handle が完全一致する場合しか重複除去しないため)両方のエッジが共存してしまう。`nodes/evaluateGraph.ts` の `incomingEdges.find(...)` は配列中で最初に見つかったエッジ(=古い方)しか採用しないため、後から繋いだ方は静かに無視され、古い方のエッジを消した瞬間に見た目の値が突然切り替わるという分かりにくいバグになる(修正前に実際に発生していた)。新しいノードタイプ/接続経路を追加する際、エッジを直接 `set({ edges: ... })` する箇所を増やすなら、この置き換えロジックも一緒に通すこと。

## Undo/Redo

`state/graphStore.ts` は `past`/`future` の2つのスナップショットスタック(`{nodes, edges}`)を持ち、Ctrl+Z / Ctrl+Shift+Z(または Ctrl+Y)と `HistoryControls.tsx` のボタンで操作できます。すべての変更操作(`onNodesChange` の remove、`onEdgesChange` の remove、`onConnect`、`addNode`、`updateNodeData`)は、実際に `set()` する前に内部ヘルパー `pushHistory(key?, coalesceMs?)` を呼びます。

スライダー/カラーピッカーのドラッグは `updateNodeData` を1ジェスチャーあたり何十回も連続発火させるため、`key`(`data:${id}` など)と `coalesceMs` を指定すると、直前のプッシュから `coalesceMs` 以内・同じ `key` での呼び出しはスタックに新規エントリを積まず「同じジェスチャーの続き」として吸収されます(タイムスタンプだけ更新)。ノードのドラッグ移動は `dragging` フラグの立ち上がりエッジ(`_dragging` 内部状態)で1ドラッグ=1エントリに区切っており、こちらは時間ベースのコアレッシングを使っていません。`past`/`future` は localStorage に永続化されず(`partialize` は `nodes`/`edges` のみ)、`loadGraph`(JSON インポート/プリセット読み込み)は履歴をクリアします。**そのため、リロード後は Undo で以前の状態に戻すことはできません。**

## 初期状態への復帰: initialGraph.json と「初期状態(デフォルト)」プリセット

`state/initialGraph.ts` は実データを持たず、`state/initialGraph.json`(プリセットや GraphIO の Export/Import と同じ `{ nodes, edges }` 形状)を読み込んで型付けして再エクスポートするだけの薄いラッパーです。JSON はコメントを持てないため、データに埋め込まれていた設計意図(シードノードの慣例、bodyBuild 乗算、sleeve/socks の再引きなど)は `initialGraph.ts` 冒頭のコメントに集約しています。`initialGraph.json` を直接編集した場合、この解説コメントが古くならないよう合わせて見直してください。

`editor/PresetPanel.tsx` はこの `initialNodes`/`initialEdges` を、`usePresetStore` に保存されたユーザープリセットとは別に「初期状態(デフォルト)」という擬似プリセット(固定ID `__initial__`、常にドロップダウン先頭に表示、削除不可)としてロード可能にしています。上記の「リロード後は Undo で戻せない」問題への対処として、ユーザーはこのプリセットを選んで Load することでいつでも初期グラフに戻せます。
