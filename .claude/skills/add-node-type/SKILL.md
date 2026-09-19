---
name: add-node-type
description: ノードグラフに新しい NodeTypeDefinition(ノードタイプ)を追加する際の手順。新規ノードタイプの実装・登録が必要なときに使用する。
---

# 新しいノードタイプの追加

`nodes/definitions/**/*.ts` に `evaluate()` と `createDefaultData()` を持つ `NodeTypeDefinition` を実装するだけでよい(ガーメント固有のグループノード・生成ノードは `groups/`、複数ガーメントで使い回す汎用ノードは `generic/` に置く。`generatorNodeFactory.ts`/`groupNodeFactory.ts` などの共通基盤と、`constNumberInput.ts`/`garmentOutput.ts`/`garmentParts.ts` のようなグループ定義用ヘルパーは `nodes/definitions/` 直下で、これらは `index.ts` の glob の除外リストに載せる)。`registerNodeType()` を呼ぶ副作用インポートとして、そのファイルは `definitions/index.ts` の `import.meta.glob()` によって(サブディレクトリを含め再帰的に)自動的に読み込まれ、`editor/NodeEditor.tsx` の `nodeTypes` にも `nodeTypeRegistry` から自動的に反映される(専用UIが要る場合だけ `NODE_VIEW_OVERRIDES` に追加する)。`index.ts` や `NodeEditor.tsx` への手動登録は不要。

## ガーメントジェネレーターノード(category: 'generator')の場合

belt/dress/top/sleeve/necktie のようにフィールドの値を解決して `build*Geometry()` にそのまま渡すだけのノードは、`registerNodeType()` を直接書かず `nodes/definitions/generatorNodeFactory.ts` の `defineGeneratorNode()` を使う(既存の generator 系 definition ファイル全てを参照)。フィールド仕様(`id`/`label`/`default`、必要なら `round: true` や `type: 'enum'`)を渡すだけで interface 型・`DEFAULTS`・`inputs` 配列・`createDefaultData`・`evaluate` を機械的に組み立ててくれる。`build*Geometry` が受け取らない固定値(ソケット化しない `angleSegments` など)は `extra` で渡す。

- `build` に渡す関数は `build: buildXxxGeometry` のように値としてそのまま渡さず、必ず `build: (params) => buildXxxGeometry(params)` とアロー関数で包むこと。値として直接渡すと ESM のライブバインディングが切れ、`vi.spyOn(module, 'buildXxxGeometry')` を使うテスト(`testHelpers.ts` の `expectGeneratorForwardsData`)が呼び出しを検出できなくなる。
- `fields` の `default` は `defineGeneratorNode` 内部で `DEFAULTS`/`inputs`/`createDefaultData` に自動展開されるため、リテラル値を複数箇所に書く必要はない。

## グループノード(category: 'group')の場合

複数の既存ノード(`numberMultiply`+generator+`toonMaterial`+`enumInput`/`numberInput`+`garmentPlacement` など)を1つの埋め込みサブグラフとして内包し、外部には限られた入出力ソケットだけを見せたい場合は、`registerNodeType()` を直接書かず `nodes/definitions/groupNodeFactory.ts` の `defineGroupNode()` を使う(`nodes/definitions/groups/skirtGroupNode.ts` 等、既存14種のガーメントグループを参照)。詳細は [`src/nodes/CLAUDE.md`](../../../src/nodes/CLAUDE.md) の「グループノード」節、手順は [`add-garment-type` スキル](../add-garment-type/SKILL.md)を参照。外部から注入できる型に制限は無く、内部配線もノードインスタンスごとに独立してグラフ上で編集できる(ダブルクリックで中に入る)。

## それ以外のノードタイプ(input/material/output)の場合

`registerNodeType()` を直接呼ぶ。

- `createDefaultData()` は `NodePalette.tsx` / `graphStore.addNode()` が新規追加インスタンスの初期値を作る際に使われる。
- 既定値はファイル内に `const DEFAULTS = { ... }` として1箇所だけ定義し、`createDefaultData: () => ({ ...DEFAULTS })` と `evaluate()` 内の `data.x ?? DEFAULTS.x` フォールバックの両方から参照する。リテラル値を2箇所に書くと、片方だけ変更したときに「新規ノード作成時」と「フィールド欠損時(古い保存グラフ)」の既定値が食い違う。

## 数値演算ノード(単項/二項)の場合

`numberAdd`/`numberSubtract`/`numberMultiply`/`numberMax`(二項)や `numberNegate`/`numberHalf`(単項)のように数値を1つ返すだけのノードは、`registerNodeType()` を直接呼ぶ(`nodes/definitions/generic/numberNegate.ts` が最小の実例)。ノードカード上でラベルを改名できるようにしたい場合は、`editor/nodeComponents/GenericNode.tsx` の `EDITABLE_LABEL_TYPES` に type 名を追加する。

## 守ること(評価キャッシュとの関係)

`evaluateGraph()` はノード単位でメモ化しており、`node.data` の参照と解決済み `inputs` が前回と同じなら `evaluate()` を呼ばずに前回の結果を返す([`src/nodes/CLAUDE.md`](../../../src/nodes/CLAUDE.md) の「ノード単位のメモ化キャッシュ」)。そのため `evaluate(inputs, data)` は `inputs`/`data` だけに依存する純粋関数にし、`inputs` で受け取った `geometry`/`material`/`points` を直接ミューテートしない(`.clone()` してから変換する)こと。

## テスト

`nodes/definitions/generic/<name>.test.ts`(既存の generic ノードのテストを参照)を追加する。同じ型・同じ inputs で `evaluate()` を複数回呼ぶテストは `src/testSetup.ts` が各テスト前にキャッシュをリセットするので互いに独立している。グループノードを追加した場合は `groupNodeWiring.test.ts` が配線のタイポを自動検知する。
