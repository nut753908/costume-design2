# src/nodes/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## ノードグラフエンジン

React Flow (`src/editor/`) は UI の状態(ノードの位置、選択、ドラッグ)のみを保持します。実際の計算は、React Flow について何も知らない別の純粋関数レイヤーが担当します。

- `nodes/types.ts` — ソケットの型システム(`SocketType`: number/color/enum/geometry/material)と `NodeTypeDefinition`(`inputs`/`outputs` ソケットと `evaluate(inputs, data) -> outputs` 関数を宣言)。`GraphNode`/`GraphEdge` もここで定義されており、React Flow 自身の `Node`/`Edge` 型から切り離された最小限の形になっているため、evaluator は UI ライブラリなしでも利用・テスト可能です。
- `nodes/registry.ts` — `registerNodeType()` / `getNodeType()`。すべてのノードタイプ(入力、ジェネレーター、マテリアル、出力)はここに自身を登録します。`src/nodes/definitions/*.ts` が実際のノードタイプの実装であり、`definitions/index.ts` がそれらすべてを副作用インポートしてレジストリを埋めます。
- `nodes/evaluateGraph.ts` — evaluator 本体。ノードをトポロジカルソートし(Kahn のアルゴリズム、循環がある場合は `GraphCycleError` を投げる)、順番に各ノードの `evaluate()` を評価します。**未接続の入力ソケットは、そのノード自身のリテラルな `data[socketId]` の値にフォールバックします** — これは Geometry Nodes で未接続のソケットがウィジェットのデフォルト値を使うのと同じ挙動であり、単独の(未接続の)ノードでも動作するようにするための中心的な仕組みです。
- 出力カテゴリのノード(例: `garmentOutput`)には下流のソケットがなく、その `evaluate()` の戻り値は他のノードに消費されるのではなく、Scene から直接読み取られます。

## 新しいノードタイプの追加

手順は `add-node-type` スキルを参照してください。
