---
name: add-garment-type
description: 新しいガーメント種(skirt/belt/hat のような衣装アイテム)を追加する際の手順。新しい <name>GroupNode.ts(と、必要な場合だけ専用のジオメトリ関数+ジェネレーターノード)の実装が必要なときに使用する。
---

# 新しいガーメント種の追加

ガーメント1種は **`src/nodes/definitions/groups/<name>GroupNode.ts` のグループノード1つ**で表現する(グループ化は必須 — グループの埋め込みサブグラフ内に置く `sceneOutput` ノードが唯一の描画経路であり、グループ化しない個別配線はサポートしていない)。形状の作り方は2通りあり、**まず1(ノードグラフだけで組む)で書けないかを検討する**:

1. **ノードグラフだけで組む(既定)**: 汎用ノード(`easedLatheProfile`+`latheGenerator`、`capsuleGenerator`/`boxGenerator`/`torusGenerator` などのプリミティブ、`alignedBoxGenerator`、`translateX/Y/Z`、`scaleZ`、`mergeGeometry`、`mirrorPair` など、一覧は [`src/nodes/CLAUDE.md`](../../../src/nodes/CLAUDE.md) の「汎用ノード一覧」)の組み合わせだけで形状を作る。専用の `geometry/*.ts` も `*Generator.ts` も要らない。skirt/jacket/hat/gloves/pants/shoes/socks(Lathe 系)・scarf・bag・glasses が実例。
2. **専用ジオメトリ関数+ジェネレーターノードを作る**: 汎用ノード(`ringGridGenerator`/`taperedTubeGenerator` など)でも表現しきれない形状の場合のみ(現状の全14種はこの必要が無い)。`src/geometry/<name>.ts` の `build<Name>Geometry(params) -> THREE.BufferGeometry` と、それを配線する `groups/<name>Generator.ts` を追加し、グループの中でその Generator ノードを使う。

ノードタイプ自体の登録は `import.meta.glob` により自動化されており、レジストリへの手動登録は不要([`add-node-type` スキル](../add-node-type/SKILL.md)参照)。

## 1. 形状の設計

既存のガーメントの `<name>GroupNode.ts` を実例として読むのが早い(Lathe 系なら `hatGroupNode.ts`/`skirtGroupNode.ts`、複数プリミティブの結合なら `bagGroupNode.ts`/`glassesGroupNode.ts`/`scarfGroupNode.ts`、左右対称ペアなら `pantsGroupNode.ts`/`shoesGroupNode.ts`)。技法一覧・共有ヘルパーの使い分けは [`src/geometry/CLAUDE.md`](../../../src/geometry/CLAUDE.md) の「カスタムガーメントジオメトリ」節にまとまっているので、実装前に必ず読むこと。座標を求める四則演算は `numberAdd`/`numberSubtract`/`numberMultiply`/`numberMax`/`numberNegate`(符号反転)/`numberHalf`(半分)のノードで可視の配線として展開し、コード側の式としては持たない。定数(0/1/固定値)は `nodes/definitions/constNumberInput.ts` の `constNumberInput(id, value)` で定数の `numberInput` として置く(`numberMultiply` 等の `data` にリテラルを隠さない — 値を編集する UI が無く、キャンバス上で見えなくなるため)。

**同じファイルに書かれている「すでに一度踏んだ落とし穴」も実装前に必ず読むこと**(同 CLAUDE.md 末尾):

- 三角形の巻き順が逆だと、症状は「裏返る」ではなく**真っ黒なシルエット**になる。目視ではなく `windingTestHelpers.ts` の `expectOutwardWinding()` で検証する。単純な放射対称形状(Y軸中心)でなければ、形状に応じた `axisPoint` を渡す必要がある(箱なら自身の中心点、鏡像ペアなら centroid ではなく index 位置で左右判定、など)。
- `mergeGeometries()` は結合する全ジオメトリが同じ頂点属性(名前・itemSize)を持つことを要求する。標準プリミティブ(position/normal/uv)と手組み `BufferGeometry`(position のみ)を混ぜると `null` を返して後段が `Cannot read properties of null` で落ちる。`mergeGeometry` ノードは uv の有無だけの違いなら吸収するが、それ以外の属性の違いは吸収しない。
- アンカーは体の中心線(x=0, z=0)上の1点のみ。体の前面より前に出すべきアクセサリは z=0 付近だとガーメントの壁に埋もれて見えなくなる(`bagGroupNode.ts`/`glassesGroupNode.ts` の `bagFrontDepthIn`/`forwardDepthIn` のような固定 `numberInput`、`necktieGroupNode.ts` の `frontDepthIn` を参照)。また複数の出力ノードが同じアンカーを共有すると、後から広がる大きなガーメントが薄いアクセサリを覆い隠すことがある — バグではなく既知の特性。

## 2. (方式2のみ)ジオメトリ関数とジェネレーターノード

`src/geometry/<name>.ts` に純粋関数 `build<Name>Geometry(params)` を書き、`src/nodes/definitions/groups/<name>Generator.ts` で `defineGeneratorNode()`(`generatorNodeFactory.ts`)を使ってノード化する。

```ts
import { buildXxxGeometry } from '../../../geometry/xxx';
import { defineGeneratorNode } from '../generatorNodeFactory';

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

## 3. 配置(anchorY 用の外部ソケット + offsetY 用の numberInput / garmentPlacement)

ガーメント自体はどこにも取り付かない。取り付け位置は次の連携で決まる:

- `anchorY`(外部ソケット、`number`)— `src/state/initialGraph.ts` 側のトップレベル共有ノード `bodyLayout`(`bodyLayoutGroup`)が計算した5つのアンカー候補(`waistY`/`shoulderY`/`feetY`/`wristY`/`headCenterY`)のうち、そのガーメントが実際に使う1つを配線する(`state/initialGraph.ts` の `e-anchor-*` エッジを参照)。**新しいアンカー種を増やす場合はこの5候補と `bodyLayoutGroupNode.ts` 側の出力を同時に変更する必要がある**(通常の追加では既存5候補のどれかを再利用すれば足りる)。どのアンカーを使うかはこの配線そのものが仕様であり、実行時に選択する仕組みは無い(`src/nodes/CLAUDE.md` の「グループノード」節参照)。
- `offsetYIn`(`numberInput`)— アンカー座標からの微調整量。ガーメント固有の内部ノードとして保持する。
- `garmentPlacement` — `geometry`・`anchorY`・`offsetY` を受け取り、`anchorY + offsetY` を計算して geometry の頂点を平行移動する(Blender の Geometry Nodes で位置をジオメトリに焼き込む考え方と同じ)。出力は位置が焼き込まれた geometry 1つだけ。

`garmentPlacement` の geometry 出力と、material を生成するノード(`toonMaterial` など)の出力は、次節で作るグループの `sceneOutput` ノードへ**直接**配線する(anchorY/offsetY 自体はグループの外まで出ない)。

Scene 側の登録は不要 — `Garments.tsx` はグループの内部の `sceneOutput` が転送する予約キー(`sceneOutputGeometry<N>`/`sceneOutputMaterial<N>`)を持つ評価結果を走査してレンダリングする([`src/scene/CLAUDE.md`](../../../src/scene/CLAUDE.md))。

## 4. グループノードの定義(src/nodes/definitions/groups/\<name\>GroupNode.ts)

`nodes/definitions/groupNodeFactory.ts` の `defineGroupNode()` で、形状を作るノード群+末端(色・`offsetY`・`garmentPlacement`・`sceneOutput`)を1枚の `<name>Group` ノードに集約する(詳細は [`src/nodes/CLAUDE.md`](../../../src/nodes/CLAUDE.md) の「グループノード」節)。定型部分は次のヘルパー(いずれも `nodes/definitions/` 直下、`index.ts` の自動登録 glob の対象外)が生成する:

- `anchorYSocket`(`garmentOutput.ts`)— 全ガーメントの `groupInput` の `sockets` に入れる `anchorY` ソケット定義。`garmentOutput({ color, offsetY, geometry })`(同ファイル)— `colorIn`(colorInput)→`material`(toonMaterial)→`sceneOut` と `offsetYIn`+`input.anchorY`→`placement`(garmentPlacement)→`sceneOut` のノード5個・エッジ6本。`geometry` には最終的な geometry を出力するノードの id を渡す。
- `bodyBuildScale(rawId)`(`garmentParts.ts`)— 「体に触れる半径」(`rawId` の `value`)× `input.bodyBuild` の `scale`(`numberMultiply`)。半径スケーリングが要る場合だけ使う。
- `latheBody({ genId, direction, steps, startRadius, endRadius, distance })`(`garmentParts.ts`)— `profile`(`easedLatheProfile`)→ `genId`(`latheGenerator`)の定型。グループ内に `segmentsIn`(numberInput)が必要。

外部から見える入出力ソケットは、埋め込みサブグラフの中に置く `groupInput` ノード自身が定義する(`config` に `inputs`/`outputs` フィールドは無い)。**`anchorY` は、`garmentPlacement` が取り付け座標を計算するために全ガーメントが例外なく外部ソケットとして持つ**(下記5節参照)。それ以外に外部ソケットとして公開してよいのは、`bodyBuild`(半径スケーリングに使う場合)や `legSpacing`(`bodyDimensions` から配線)のように複数ガーメントで共有される値だけ。ガーメント固有の生パラメータ(半径・長さ・色など)は `groupInput` のソケットにはせず、`internalNodes` に直接 `numberInput`/`colorInput` ノードとして書く。Lathe 系(半径スケーリングあり)の最小例:

```ts
import { defineGroupNode } from '../groupNodeFactory';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { bodyBuildScale, latheBody } from '../garmentParts';

const output = garmentOutput({ color: '#cccccc', offsetY: 0, geometry: 'gen' });
const scale = bodyBuildScale('radiusIn');
const lathe = latheBody({ genId: 'gen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'endRadiusIn', distance: 'lengthIn' });

defineGroupNode({
  type: 'xxxGroup',
  label: 'Xxx',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        // anchorY は全ガーメント共通で必須。bodyBuild は半径スケーリングに使う場合だけ。
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
        ],
      },
    },
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.3} },
    { id: 'endRadiusIn', type: 'numberInput', data: { value: 0.2} },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5} },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24} },
    ...scale.nodes,
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [...scale.edges, ...lathe.edges, ...output.edges],
});
```

`groupOutput` は省略可能で、既存14種のガーメントはどれも含めていない(描画は `sceneOutput` が専任で担う)。他ガーメントの内部値を再引きしたい場合に `groupOutput` で公開する方法も技術的には可能だが、その値が本当にそのガーメント専用か、複数ガーメントで共有すべき値かは下記5節の判断基準を先に確認すること。

## 5. initialGraph.ts への配線(慣例)

既存14種は、ガーメント固有の生パラメータ・Color を上記のとおりグループの `internalNodes` に埋め込み済みのため、`src/state/initialGraph.ts` 側には**そのグループノード自体を1つ置くだけ**でよい(パレットからのドラッグ待ちにしていない、という方針自体は変わらない)。**`anchorY` は、`garmentPlacement` の取り付け座標計算のために必ず配線すること** — トップレベルの共有ノード `bodyLayout`(`bodyLayoutGroup`)の5つのアンカー候補出力(`waistY`/`shoulderY`/`feetY`/`wristY`/`headCenterY`)のうち、そのガーメントが実際に取り付く1つを選び、`bodyLayout → xxxGroup.anchorY` という形で配線する(既存の `e-anchor-*` エッジを参照)。これを省くと、`garmentPlacement` は既定値(0)にフォールバックするため、そのガーメントが原点付近に張り付いたまま描画される。加えて、そのガーメントの「体に触れる半径」(waist/shoulder側/wrist/sole/ankle 相当)がある場合は、`bodyBuild → xxxGroup.bodyBuild` という別のエッジ(半径スケーリング専用、`bodyDimensions`/`bodyLayout` を経由しない)も配線すること。hand/cuff/calf/brim/crown 相当の独立したスタイル寄りの半径は、半径スケーリングの対象外でよい(ただし `anchorY` 配線は省略しない)。詳細はルート [`CLAUDE.md`](../../../CLAUDE.md) の「Body(3Dモデル本体)も他14種のガーメントと同じ `<name>Group` ノードで組み立てられる」節を参照。

新しいガーメントが pants/shoes/socks の Leg Spacing(`bodyDimensions.legSpacing` を bodyGroup と共有)や gloves の Arm Spacing(`bodyDimensions.shoulderSpacing` を bodyGroup と共有)のように**複数ガーメントで共有される値**を必要とする場合のみ、その値は生パラメータのグループへの内包を見送り、`src/state/initialGraph.ts` 側に外部の共有ノードとして残し、関係する各グループの `groupInput` ソケットへファンアウトすること(`bodyDimensions.legSpacing → pantsGroup.legSpacing`/`shoesGroup.legSpacing`/`socksGroup.legSpacing` の実例を参照)。共有元の計算(`numberMultiply`/`toonMaterial` など)自体もどちらか一方のグループの内部に置かず、この共有ノード側に置くこと — 一方のグループに計算を残して `groupOutput` で他方へ再公開する形は、後から見て「なぜこの値だけ特別扱いなのか」が分かりにくくなる(`src/nodes/CLAUDE.md` の「グループノード」節参照)。

ノードの `position` は `initialGraph.ts` には書かず、モジュール読み込み時に `nodes/autoLayout.ts` の `computeAutoLayout()`(Arrange ボタンと同じ関数)で自動算出される。ガーメントを追加しても座標を手で更新する必要は無い(グループ内部の `internalNodes` の座標も同じく自動算出)。

## 6. テスト

- **グループの配線**: `src/nodes/definitions/groupNodeWiring.test.ts` が登録済みの全グループ型について、内部ノードの type が登録済みか・内部エッジの端点が実在するノードの実在するソケットか・1入力に複数エッジが無いかを自動で走査するので、新しいグループも追加するだけで対象になる(タイポの検知はこれで足りる)。
- **グループの挙動**: `src/nodes/definitions/groups/<name>GroupNode.test.ts` に、既定値での出力(`sceneOutputGeometry0`/`sceneOutputMaterial0` が出る)、Body Build によるスケール、`anchorY` の加算、主なパラメータの効果を bounding box で検証する。Lathe 系は `direction` に応じたプロファイルの半径が単調に変化することを使って `LatheGeometry` の bounding box から期待値を計算できる(`skirtGroupNode.test.ts`/`pantsGroupNode.test.ts` 参照)。専用のジオメトリ関数を呼ぶ形(方式2)は `topGroupNode.test.ts`/`dressGroupNode.test.ts` のように `vi.spyOn` で呼び出し引数を検証する。
- **(方式2のみ)ジオメトリ**(`src/geometry/<name>.test.ts`): 妥当性(index が3の倍数・NaN無し)、パラメータを変えたときの効果、`expectOutwardWinding()` による巻き順検証。`belt.test.ts`/`dress.test.ts`/`alignedBox.test.ts` を参照。
- **(方式2のみ)ジェネレーター**(`groups/<name>Generator.test.ts`): `testHelpers.ts` の `expectGeneratorForwardsData()` で、フィールド名の取り違えが無いか検証する。

## 7. 見た目の確認

テストと型チェックだけでは「実際に画面でどう見えるか」は分からない。[`run-costume-design2` スキル](../run-costume-design2/SKILL.md)でヘッドレスChromiumから実際にノードを繋いでスクリーンショットを撮り、真っ黒なシルエットになっていないか・アンカー位置がおかしくないかを確認すること。

## 8. ドキュメント更新

`src/geometry/CLAUDE.md` の「カスタムガーメントジオメトリ」冒頭にあるガーメント一覧(現在14種、専用の `build*Geometry()` を持たない種類の一覧を含む)に追加したガーメントを足す。新しい構築技法・共有ヘルパーを導入した場合や、新しい落とし穴を踏んだ場合はその節も追記する。pre-commit フックがステージ内容と対応する `CLAUDE.md` の有無をリマインドするが、機械判定なので実際に更新が必要かは都度判断すること。
