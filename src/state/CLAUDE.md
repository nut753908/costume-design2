# src/state/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) は React Flow の揮発性フィールド(position、selected、dragging)を取り除き — これが重要な点ですが — それらの揮発性フィールドのみが変化した場合には**同一の配列参照**を返します。これは ref にキャッシュした手動の等価性チェックによるものです(最初に試した zustand の `useShallow` ではありません。これは新しくマップされたオブジェクトに対して一階層のみの `Object.is` 比較を行うため、無限レンダーループを引き起こしました)。`state/useEvaluatedGraph.ts` はこれらの安定した参照を持つ配列を `useMemo(() => evaluateGraph(...))` に渡すため、ジオメトリ/マテリアルの再計算はノードの*データ*やエッジが実際に変化したときにのみ発生し、ドラッグ中やフレームごとには発生しません。これはシーンペイン右下に表示される `evaluations: N` カウンターで実際に確認できます。

## Undo/Redo

`state/graphStore.ts` は `past`/`future` の2つのスナップショットスタック(`{nodes, edges}`)を持ち、Ctrl+Z / Ctrl+Shift+Z(または Ctrl+Y)と `HistoryControls.tsx` のボタンで操作できます。すべての変更操作(`onNodesChange` の remove、`onEdgesChange` の remove、`onConnect`、`addNode`、`updateNodeData`)は、実際に `set()` する前に内部ヘルパー `pushHistory(key?, coalesceMs?)` を呼びます。

スライダー/カラーピッカーのドラッグは `updateNodeData` を1ジェスチャーあたり何十回も連続発火させるため、`key`(`data:${id}` など)と `coalesceMs` を指定すると、直前のプッシュから `coalesceMs` 以内・同じ `key` での呼び出しはスタックに新規エントリを積まず「同じジェスチャーの続き」として吸収されます(タイムスタンプだけ更新)。ノードのドラッグ移動は `dragging` フラグの立ち上がりエッジ(`_dragging` 内部状態)で1ドラッグ=1エントリに区切っており、こちらは時間ベースのコアレッシングを使っていません。`past`/`future` は localStorage に永続化されず(`partialize` は `nodes`/`edges` のみ)、`loadGraph`(JSON インポート/プリセット読み込み)は履歴をクリアします。
