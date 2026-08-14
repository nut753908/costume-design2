---
name: add-node-type
description: ノードグラフに新しい NodeTypeDefinition(ノードタイプ)を追加する際の手順。新規ノードタイプの実装・登録が必要なときに使用する。
---

# 新しいノードタイプの追加

すべての `NodeTypeDefinition` (`nodes/definitions/*.ts`) は、`evaluate()` に加えて `createDefaultData()` が必要です — これは `NodePalette.tsx` / `graphStore.addNode()` が新規追加インスタンスの初期値を作る際に使われます。

手順:

1. `nodes/definitions/*.ts` に `evaluate()` と `createDefaultData()` を持つ `NodeTypeDefinition` を実装する。
2. モジュールを `nodes/definitions/index.ts` に登録する(副作用インポート)。

`editor/NodeEditor.tsx` の `nodeTypes` はレジストリ(`nodes/registry.ts` の `nodeTypeRegistry`)から自動導出されるため、新しいタイプへの追記は不要。専用UIが要る場合(`NumberInputNode`/`ColorInputNode`/`EnumInputNode` のような)だけ `NodeEditor.tsx` の `NODE_VIEW_OVERRIDES` に追加し、それ以外は自動的に `GenericNodeView` になる。
