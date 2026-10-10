---
name: add-node-type
description: ノードグラフに新しい NodeTypeDefinition(ノードタイプ)を追加する際の手順。新規ノードタイプの実装・登録が必要なときに使用する。
---

# 新しいノードタイプの追加

まず `nodes/definitions/` と `nodes/definitions/generic/` に、近い処理をする汎用ノードが既に無いか確認する。

## 置き場所と登録

`nodes/definitions/**/*.ts` に `NodeTypeDefinition`(`evaluate()` と `createDefaultData()`)を実装する。グループノードは `groups/`、使い回す汎用ノードは `generic/` に置く。`definitions/index.ts` の `import.meta.glob()` がサブディレクトリまで再帰的に読み込み、`NodeEditor.tsx` の `nodeTypes` にも自動で反映されるので、手動の登録は要らない。

- `generatorNodeFactory.ts`/`groupNodeFactory.ts` のような共通基盤や、`garmentOutput.ts` のようなグループ定義用のヘルパーは `nodes/definitions/` 直下に置き、`index.ts` の glob の除外リストに載せる。
- 専用のカード UI が要る場合だけ、`nodes/customCardTypes.ts` の `CUSTOM_CARD_TYPES` と `NodeEditor.tsx` の `NODE_VIEW_OVERRIDES` に追加し、カードの高さの見積もりも対応させる(`src/editor/CLAUDE.md` 参照)。

`category` はパレットの見出しを決める: `input`/`math`/`primitive`(形状の生成)/`geometry-op`(形状の変換・結合)/`points`(曲線の加工)/`material`/`output`。`group`/`group-io` は機能に使われる特別なカテゴリなので、通常のノードには使わない。

## 定義の書き方

- **フィールドの値を `build*Geometry()` へ渡すだけの生成ノード**は `defineGeneratorNode()`(`generatorNodeFactory.ts`)を使う。フィールド(`id`/`label`/`default`、整数なら `round: true`)を渡すと、`inputs`・`createDefaultData`・`evaluate` を組み立てる。ソケットにしない固定値は `extra` で渡す。
  - `build` は `build: (params) => buildXxxGeometry(params)` とアロー関数で包む。`build: buildXxxGeometry` と値で渡すと ESM のライブバインディングが切れ、`vi.spyOn` を使うテスト(`testHelpers.ts` の `expectGeneratorForwardsData`)が呼び出しを検出できない。
- **複数の既存ノードを内包するグループノード**は `defineGroupNode()` を使う(`src/nodes/CLAUDE.md` の「グループノード」節)。ガーメントなら `add-garment-type` スキルを参照。
- **それ以外**(数値演算・曲線の加工・`curve` を扱う生成ノードなど)は `registerNodeType()` を直接呼ぶ(最小の例は `generic/numberNegate.ts`)。
  - 既定値はファイル内の `const DEFAULTS = { ... }` 1箇所に書き、`createDefaultData: () => ({ ...DEFAULTS })` と `evaluate()` の `data.x ?? DEFAULTS.x` の両方から参照する(2箇所に書くと、新規作成時と古い保存グラフの既定値が食い違う)。
  - `number`/`color` の入力には `default` を付ける(未接続時に入力欄が出る)。

`evaluate(inputs, data)` は純粋関数にし、受け取った `geometry`/`material`/`curve` を直接ミューテートしないこと(評価キャッシュの前提。`src/nodes/CLAUDE.md` 参照)。

## テスト

`nodes/definitions/generic/<name>.test.ts` を追加する(既存の generic ノードのテストを参照)。グループノードを追加した場合は `groupNodeWiring.test.ts` が内部配線の誤りを自動で検知する。
