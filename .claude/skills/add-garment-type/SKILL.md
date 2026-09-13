---
name: add-garment-type
description: 新しいガーメント種(skirt/belt/hat のような衣装アイテム)を追加する際の手順。新しい build*Geometry とそれを配線するジェネレーターノードの実装が必要なときに使用する。
---

# 新しいガーメント種の追加

ガーメント1種の追加には3ファイルが要る(グループ化は必須 — グループの `groupOutput` ノードが唯一の外部出力経路であり、グループ化しない個別配線は現在サポートしていない)。

1. `src/geometry/<name>.ts` — `build<Name>Geometry(params) -> THREE.BufferGeometry` という純粋関数。
2. `src/nodes/definitions/<name>Generator.ts` — 1のジオメトリ関数をノードグラフに配線するノードタイプ。ノードタイプ自体の登録は `import.meta.glob` により自動化されているので、これ以外にレジストリへの手動登録は不要([`add-node-type` スキル](../add-node-type/SKILL.md)参照)。
3. `src/nodes/definitions/<name>GroupNode.ts` — 2のジェネレーターノードを含む数ノードを1枚のグループノードに集約する(下記4節参照)。

## 1. ジオメトリ実装(src/geometry/)

放射対称な回転体なら `latheProfile.ts` の `buildEasedLatheProfile()` を `THREE.LatheGeometry` に渡すだけで大半は足りる(skirt/pants/shoes/gloves/hat/belt/jacket/socks が実例)。それ以外の形状(左右対称パーツ、ネックラインのような非対称の落ち込み、剛体プリミティブの組み合わせなど)は既存の共有ヘルパー(`mirrorPair.ts`/`neckline.ts`/`alignedBox.ts`)や手組み `BufferGeometry` の実例を参照。詳細な技法一覧・共有ヘルパーの使い分けは [`src/geometry/CLAUDE.md`](../../../src/geometry/CLAUDE.md) の「カスタムガーメントジオメトリ」節にまとまっているので、実装前に必ず読むこと。

**同じファイルに書かれている「すでに一度踏んだ落とし穴」も実装前に必ず読むこと**(同 CLAUDE.md 末尾):

- 三角形の巻き順が逆だと、症状は「裏返る」ではなく**真っ黒なシルエット**になる。目視ではなく `windingTestHelpers.ts` の `expectOutwardWinding()` で検証する。単純な放射対称形状(Y軸中心)でなければ、形状に応じた `axisPoint` を渡す必要がある(箱なら自身の中心点、鏡像ペアなら centroid ではなく index 位置で左右判定、など)。
- `mergeGeometries()` は結合する全ジオメトリが同じ頂点属性(名前・itemSize)を持つことを要求する。標準プリミティブ(position/normal/uv)と手組み `BufferGeometry`(position のみ)を混ぜると `null` を返して後段が `Cannot read properties of null` で落ちる。手組み側にダミー属性を足すか、混ぜないこと。
- アンカーは体の中心線(x=0, z=0)上の1点のみ。体の前面より前に出すべきアクセサリは z=0 付近だとガーメントの壁に埋もれて見えなくなる(`*_DEPTH` 定数のパターンを参照)。また複数の出力ノードが同じアンカーを共有すると、後から広がる大きなガーメントが薄いアクセサリを覆い隠すことがある — バグではなく既知の特性。

## 2. ノード登録(src/nodes/definitions/)

「フィールドの値を解決して `build*Geometry` にそのまま渡すだけ」という形(既存15種すべてがこれ)なら、`registerNodeType()` を直接書かず `generatorNodeFactory.ts` の `defineGeneratorNode()` を使う。

```ts
import { buildXxxGeometry } from '../../geometry/xxx';
import { defineGeneratorNode } from './generatorNodeFactory';

defineGeneratorNode({
  type: 'xxxGenerator',
  label: 'Xxx',
  build: (params) => buildXxxGeometry(params), // 必ずアロー関数で包む(下記参照)
  fields: [
    { id: 'radius', label: 'Radius', default: 0.3 },
    // ...
    { id: 'segments', label: 'Segments', default: 24, round: true }, // 整数丸め+下限3クランプ
  ],
});
```

- `build` は `build: buildXxxGeometry` と値で直接渡さない。ESM のライブバインディングが切れ、`vi.spyOn(module, 'buildXxxGeometry')` を使うテスト(`testHelpers.ts` の `expectGeneratorForwardsData`)が呼び出しを検出できなくなる。
- `fields` の `default` は `DEFAULTS`/`inputs`/`createDefaultData` に自動展開されるので、リテラル値を複数箇所に書く必要はない。
- `build*Geometry` が受け取るがソケット化しない固定値(角度分割数など)は `fields` ではなく `extra` で渡す。

`fields` を解決するだけで済まない形(独自の入力ソケット構成が要る、他ノードの出力に依存するなど)の場合のみ `registerNodeType()` を直接呼ぶ。その場合の既定値の扱いは [`add-node-type` スキル](../add-node-type/SKILL.md)の「それ以外のノードタイプ」節を参照。

## 3. 描画と配置(garmentMesh / garmentAnchor)

ガーメント自体はどこにも取り付かない。`geometry` 出力を `toonMaterial` 経由(または直接)で `garmentMesh` ノードへ繋ぐと、その geometry+material のペアが描画対象になる — `garmentMesh` は2つをそのまま転送するだけの描画専用ノードで、`data` を一切持たない。

取り付け位置は別ノード `garmentAnchor` が担う。入力を持たず、`data.anchor` で取り付け位置を選ぶ。`anchor` は `'waist' | 'shoulder' | 'feet' | 'wrist' | 'head'` の固定列挙(`garmentAnchor.ts`)で、これらは `body.ts` の `computeBodyAnchors()` が返す座標に対応する。**新しいアンカー種を増やす場合は `garmentAnchor.ts` の型と `body.ts`/`Body.tsx`/`Garments.tsx` 側の対応を同時に変更する必要がある**(通常の追加では既存アンカーのどれかを再利用すれば足りる)。

`garmentMesh`/`garmentAnchor` は責務を分けた2つの別ノードで、以前あった `garmentOutput` という1ノードでの兼務(描画+配置+material未配線時のフォールバック生成)は廃止した。この2ノードの出力は、次節で作るグループの `groupOutput` ノードへ配線して初めてグループ本体の外部出力になる。

Scene 側の登録は不要 — `Garments.tsx` は全ノードの評価結果を走査し `geometry`+`material` を持つものを自動的にレンダリングする([`src/scene/CLAUDE.md`](../../../src/scene/CLAUDE.md))。

## 4. グループノードの定義(src/nodes/definitions/\<name\>GroupNode.ts)

既存15種すべてが「numberMultiply(体に触れる半径があれば)+ generator + toonMaterial + garmentMesh + garmentAnchor + groupOutput」を1枚の `<name>Group` ノードに集約している(`nodes/definitions/groupNodeFactory.ts` の `defineGroupNode()`、詳細は [`src/nodes/CLAUDE.md`](../../../src/nodes/CLAUDE.md) の「グループノード」節を参照)。新しいガーメントも同じ形にすること — `skirtGroupNode.ts` を実例として参照するのが早い。

外部から見える入出力ソケットは、埋め込みサブグラフの中に置く `groupInput`/`groupOutput` ノード(Blender の Geometry Nodes における Group Input/Output ノード相当)自身が定義する。`config` に `inputs`/`outputs` フィールドは無く、`internalNodes` 内の `groupInput` ノードの `data.sockets` から `defineGroupNode()` が登録時に自動導出する。

**外部ソケットとして公開するのは、`bodyBuild`(全ガーメント共有)や `pantsLegSpacing` のように複数ガーメントで共有される値だけ**にすること。ガーメント固有の生パラメータ(半径・長さ・色など、他のガーメントから参照されないもの)は `groupInput` のソケットにはせず、`internalNodes` に直接 `numberInput`/`colorInput`/`enumInput` ノードとして書き、内部の消費先ノードへ直接配線する:

```ts
import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'xxxGroup',
  label: 'Xxx',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        // 他ガーメントと共有される値だけをここに書く。
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
      },
    },
    // ガーメント固有の生パラメータは internalNodes に直接、通常の numberInput/colorInput/
    // enumInput ノードとして持たせる(旧 initialGraph.ts 側にあった個別ノードと同じ形)。
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.3, min: 0.1, max: 0.5, step: 0.01, label: 'Radius' } },
    // ...
    { id: 'colorIn', type: 'colorInput', data: { hex: '#cccccc', label: 'Xxx Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} }, // 体に触れる半径が無ければ省略
    { id: 'gen', type: 'xxxGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'mesh', type: 'garmentMesh', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'waist', offsetY: 0 } },
    // groupOutput は必須 — グループの外部出力はこのノードに実際に配線された値だけになる。
    // geometry/material は mesh(garmentMesh)から、anchor/offsetY は anchor(garmentAnchor)
    // からここへ配線すること。
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'material', label: 'Material', type: 'material' },
          { id: 'anchor', label: 'Anchor', type: 'enum' },
          { id: 'offsetY', label: 'Offset Y', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    // ... radiusIn.value -> scale.value, input.bodyBuild -> scale.factor, scale -> gen.radius,
    // colorIn.color -> material.color, gen.geometry -> mesh.geometry, material.material -> mesh.material, ...
    { source: 'mesh', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'mesh', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchor', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'anchor', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
```

外部から注入できる型に制限は無い(`groupInput` ノードの出力ソケットとしてそのまま流し込まれるだけなので geometry/material も注入できる)。他ガーメントの内部値を再引きしたい場合、上記の `outputIO` ノードへ追加でソケットを増やして配線する方法も技術的には可能だが、その値が本当にそのガーメント専用か、複数ガーメントで共有すべき値かは下記5節の判断基準を先に確認すること。

`groupInput` は省略可 — 他ガーメントと共有される値が1つも無いガーメントでは `groupInput` ノード自体を `internalNodes` に含めなくてよい(`hatGroupNode.ts`/`bagGroupNode.ts`/`necktieGroupNode.ts`/`glassesGroupNode.ts` の実例を参照。外部から見た入力ソケットは0個になる)。`groupOutput` は省略不可(無いと `defineGroupNode()` が登録時に例外を投げる)。

## 5. initialGraph.ts への配線(慣例)

既存15種は、ガーメント固有の生パラメータ・Color を上記のとおりグループの `internalNodes` に埋め込み済みのため、`src/state/initialGraph.ts` 側には**そのグループノード自体を1つ置くだけ**でよい(パレットからのドラッグ待ちにしていない、という方針自体は変わらない)。そのガーメントの「体に触れる半径」(waist/shoulder側/wrist/sole/ankle 相当)がある場合は、グループノードの `Body Build` 入力ソケットへ `bodyBuild` を配線すること(例: `bodyBuild → skirtGroup.bodyBuild`)。これを省くと、ボディをリサイズしたときだけそのガーメントが体を突き抜けたり浮いたりする。hand/cuff/calf/brim/crown 相当の独立したスタイル寄りの半径はスケール対象外でよい。詳細はルート [`CLAUDE.md`](../../../CLAUDE.md) の「ボディスケールはソケットグラフを迂回して直接読み取られる」節を参照。

新しいガーメントが pants/shoes/socks の Leg Spacing や topGroup/sleeveGroup の Torso Radius/Material のように**複数ガーメントで共有される値**を必要とする場合のみ、その値は生パラメータのグループへの内包を見送り、`src/state/initialGraph.ts` 側に外部の共有ノードとして残し、関係する各グループの `groupInput` ソケットへファンアウトすること(`pantsLegSpacing → pantsGroup.legSpacing`/`shoesGroup.legSpacing`/`socksGroup.legSpacing`、`topRadiusScale → topGroup.torsoRadius`/`sleeveGroup.attachRadius` の実例を参照)。共有元の計算(`numberMultiply`/`toonMaterial` など)自体もどちらか一方のグループの内部に置かず、この共有ノード側に置くこと — 一方のグループに計算を残して `groupOutput` で他方へ再公開する形は、後から見て「なぜこの値だけ特別扱いなのか」が分かりにくくなる(実際に topGroup/sleeveGroup で踏んだ落とし穴、`src/nodes/CLAUDE.md` の「グループノード」節参照)。

ノードの `position` は `nodes/autoLayout.ts` の `computeAutoLayout()`(Arrange ボタンが使う汎用アルゴリズム)ではなく、`src/state/initialGraph.ts` 冒頭のコメントに書かれている手作業の列テンプレートに従って配置すること。汎用アルゴリズムは全ガーメントの入力ノードを1つの巨大な層にまとめてしまい、エッジがノード上を大量に横切る見づらいレイアウトになるため、初期グラフでは採用していない。グループ化されたガーメント1つ分は x=260 のグループノード1つのみ(生パラメータは内部に埋め込まれているため、このファイル側にはもう列を持たない)。新しいガーメントは、関連の薄い既存ガーメント2つの間ではなく、末尾(または `top`+`sleeve`・`pants`+`shoes`+`socks` のように依存関係のあるガーメントに隣接させる場合はそのすぐ下)に追加する。`<name>GroupNode.ts` の `internalNodes` 自体の座標は `nodes/autoLayout.ts` の `computeAutoLayout()` が自動算出するため、手作業での配置は不要。

## 6. テスト

- **ジオメトリ**(`src/geometry/<name>.test.ts`): 妥当性(index が3の倍数・NaN無し)、パラメータを変えたときの効果(半径を上げたら bounding box が広がる、など)、`expectOutwardWinding()` による巻き順検証。`belt.test.ts`/`bag.test.ts`/`glasses.test.ts` を実例として参照(後者2つは Y軸以外の `axisPoint` を渡す例)。
- **ノード**(`src/nodes/definitions/<name>Generator.test.ts`): `testHelpers.ts` の `expectGeneratorForwardsData()` で、フィールド名の取り違え(例: width と height の入れ替わり)が無いか検証する。既存の `*Generator.test.ts` を参照。

## 7. 見た目の確認

テストと型チェックだけでは「実際に画面でどう見えるか」は分からない。[`run-costume-design2` スキル](../run-costume-design2/SKILL.md)でヘッドレスChromiumから実際にノードを繋いでスクリーンショットを撮り、真っ黒なシルエットになっていないか・アンカー位置がおかしくないかを確認すること。

## 8. ドキュメント更新

`src/geometry/CLAUDE.md` の「カスタムガーメントジオメトリ」冒頭にあるガーメント一覧(現在15種)に追加したガーメントを足す。新しい構築技法・共有ヘルパーを導入した場合や、新しい落とし穴を踏んだ場合はその節も追記する。pre-commit フックがステージ内容と対応する `CLAUDE.md` の有無をリマインドするが、機械判定なので実際に更新が必要かは都度判断すること。
