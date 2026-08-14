---
name: add-node-type
description: ノードグラフに新しい NodeTypeDefinition(ノードタイプ)を追加する際の手順。新規ノードタイプの実装・登録が必要なときに使用する。
---

# 新しいノードタイプの追加

`nodes/definitions/*.ts` に `evaluate()` と `createDefaultData()` を持つ `NodeTypeDefinition` を実装するだけでよい。`registerNodeType()` を呼ぶ副作用インポートとして、そのファイルは `definitions/index.ts` の `import.meta.glob()` によって自動的に読み込まれ、`editor/NodeEditor.tsx` の `nodeTypes` にも `nodeTypeRegistry` から自動的に反映される(専用UIが要る場合だけ `NODE_VIEW_OVERRIDES` に追加する)。`index.ts` や `NodeEditor.tsx` への手動登録は不要。

- `createDefaultData()` は `NodePalette.tsx` / `graphStore.addNode()` が新規追加インスタンスの初期値を作る際に使われる。
- 既定値はファイル内に `const DEFAULTS = { ... }` として1箇所だけ定義し、`createDefaultData: () => ({ ...DEFAULTS })` と `evaluate()` 内の `data.x ?? DEFAULTS.x` フォールバックの両方から参照する(既存の生成系ノードを参照)。リテラル値を2箇所に書くと、片方だけ変更したときに「新規ノード作成時」と「フィールド欠損時(古い保存グラフ)」の既定値が食い違う。
