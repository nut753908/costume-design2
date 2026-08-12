---
name: add-node-type
description: ノードグラフに新しい NodeTypeDefinition(ノードタイプ)を追加する際の手順。新規ノードタイプの実装・登録が必要なときに使用する。
---

# 新しいノードタイプの追加

すべての `NodeTypeDefinition` (`nodes/definitions/*.ts`) は、`evaluate()` に加えて `createDefaultData()` が必要です — これは `NodePalette.tsx` / `graphStore.addNode()` が新規追加インスタンスの初期値を作る際に使われます。

手順:

1. `nodes/definitions/*.ts` に `evaluate()` と `createDefaultData()` を持つ `NodeTypeDefinition` を実装する。
2. モジュールを `nodes/definitions/index.ts` に登録する(副作用インポート)。
3. そのタイプを `editor/NodeEditor.tsx` の `nodeTypes` マップに追加する。`NumberInputNode`/`ColorInputNode`/`EnumInputNode` のような専用UIが必要な場合を除き、`GenericNodeView` を再利用する。
