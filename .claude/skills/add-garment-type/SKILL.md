---
name: add-garment-type
description: 新しいガーメント種(スカート・帽子のような衣装アイテム)を追加する際の手順。新しい <name>GroupNode.ts(と、必要な場合だけ専用のジオメトリ関数+ジェネレーターノード)の実装が必要なときに使用する。
---

# 新しいガーメント種の追加

ガーメント1種は **`src/nodes/definitions/groups/<name>GroupNode.ts` のグループノード1つ**で表す。グループの中の `sceneOutput` が唯一の描画経路なので、グループ化は必須。既存の例は `camisoleDressGroup`(`groups/camisoleDressGroupNode.ts`)で、`bodyGroup` と同じパターン。方針(外部入力は `color` だけ、ボディの寸法に追従しない)はルートの `CLAUDE.md` を参照。

## 1. 形状の作り方を決める

**まず汎用ノードの組み合わせだけで組めないかを検討する(既定)。** `nodes/definitions/generic/` のノード(`profileCurve`+`loftGenerator`、`easedLatheCurve`+`latheGenerator`、`ringGridGenerator`、プリミティブ、`translate`/`scale`/`rotate`、`mergeGeometry`、`mirrorPair` など)で作れば、専用の `geometry/*.ts` もジェネレーターも要らない。各ノードの使い方はそのファイルの冒頭コメントにある。`camisoleDressGroupNode.ts`・`bodyGroupNode.ts`・`generic/limbPair.ts` が実例。

汎用ノードで表現しきれない形だけ、`src/geometry/<name>.ts` の `build<Name>Geometry(params)` と、それを `defineGeneratorNode()` で包むジェネレーターノードを追加する(書き方は `add-node-type` スキル)。

どちらの場合も、実装前に `src/geometry/CLAUDE.md` の落とし穴(巻き順・`mergeGeometries()` の頂点属性・取り付け位置が中心線上の1点だけ)を読むこと。

座標を求める計算は `numberAdd`/`numberSubtract`/`numberMultiply` などのノードで可視の配線にし、コード側の式としては持たない。定数の置き場所(入力欄の値か `numberInput` か)は `src/nodes/CLAUDE.md` の「グループノード」節に従う。

## 2. グループノードを定義する

`defineGroupNode()` で、形状を作るノード群と末端をまとめる。末端は `garmentOutput.ts` のヘルパーが作る:

- `colorSocket(hex)`: `groupInput` の `sockets` に入れる `color` ソケット(全ガーメント共通で必須)。
- `garmentOutput({ y, geometry })`: マテリアル(`toonShadowMaterial`、色は `input.color`)・`placement`(`translate`、入力欄 `y` が取り付け位置)・`sceneOut` のノードと配線。`geometry` には最終的な geometry を出力するノードの id を渡す。

`groupOutput` は含めない(描画は `sceneOutput` が担う)。最小の例:

```ts
import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';

const output = garmentOutput({ y: 1.2169, geometry: 'gen' });

defineGroupNode({
  type: 'xxxGroup',
  label: 'Xxx',
  paletteSection: 'garment',
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [colorSocket('#cccccc')] } },
    { id: 'profile', type: 'easedLatheCurve', data: { startRadius: 0.17, distance: 0.5 } },
    { id: 'gen', type: 'latheGenerator', data: { steps: 10, segments: 24 } },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'profile', sourceHandle: 'down', target: 'gen', targetHandle: 'profile' },
    ...output.edges,
  ],
});
```

## 3. 初期状態に着せる(必要なら)

`src/state/initialGraph.ts` にそのグループノードを1つ置くだけでよい(配線も座標も不要)。複数のグループで共有する値が必要になったら、`src/nodes/CLAUDE.md` の「グループノード」節に従ってトップレベルの共有ノードへ引き上げる。

## 4. テスト

- 内部配線の誤りは `groupNodeWiring.test.ts` が自動で検知する(追加するだけで対象になる)。
- `groups/<name>GroupNode.test.ts` に、既定値で `sceneOutputGeometry0`/`sceneOutputMaterial0` が出ること、`placement` の `y` で取り付け位置が動くこと、主なパラメータの効果を bounding box で検証する(`camisoleDressGroupNode.test.ts` 参照)。
- 専用のジオメトリ関数を作った場合は、`src/geometry/<name>.test.ts` で妥当性(index が3の倍数・NaN 無し)と `expectOutwardWinding()` による巻き順を、ジェネレーターは `expectGeneratorForwardsData()` でフィールドの取り違えを検証する。

## 5. 見た目の確認

`run-costume-design2` スキルでスクリーンショットを撮り、形が欠けていないか・取り付け位置がおかしくないかを確認する。

## 6. ドキュメント

新しい落とし穴を踏んだ、またはモジュールをまたぐ前提を変えた場合だけ、該当する `CLAUDE.md` に追記する。追加したガーメントの構成は書かない(コードのコメントに書く)。
