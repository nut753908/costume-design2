import { defineGroupNode } from './groupNodeFactory';

/** Body(3Dモデル本体)を、他15種のガーメントと同じ「`<name>Group` ノード」パターンで
 * 表現する。以前は `scene/Body.tsx` が `computeBodyDimensions`/`computeBodyLayout` の結果を
 * 使って `<mesh>` を直接組み立てる専用コンポーネントだったが、その組み立て(どの形状を・
 * どのサイズで・どこに置き・何色にするか)をこの `bodyGroup` の埋め込みサブグラフへ移し、
 * `scene/Body.tsx` 自体を削除した。`Garments.tsx` はノードの型を問わず内部の `sceneOutput`
 * (下記参照)だけを見て描画するため、`bodyGroup` もガーメントと全く同じ経路でシーンへ
 * 描画される(`Body` 専用の特別扱いは無くなった、ルート CLAUDE.md 参照)。
 *
 * 各部位の半径・長さ・Y座標を求める計算(`bodyDimensionsGroup`/`bodyLayoutGroup`)自体は
 * `bodyGroup` の中にネストされていない — `state/initialGraph.ts` 側のトップレベル共有ノード
 * (`bodyDimensions`/`bodyLayout`)としてただ1つだけ存在し、その9個+4個の出力を
 * `bodyGroup` の外部ソケットとして直接受け取る。以前は `bodyGroup`(1個)と15個の
 * `garmentPlacement` インスタンスのそれぞれが独立してこの2つのグループをネストし、
 * 合計16回同じ計算を重複して行っていたが、`bodyBuild`/`topRadiusScale` と同じ「値が複数
 * グループで共有される場合はトップレベルの共有ノードへ引き上げる」パターン(`nodes/CLAUDE.md`
 * の「グループノード」節)へ改め、計算そのものは1回だけに集約した(詳細な経緯は
 * `state/initialGraph.ts` のコメント参照)。この結果 `bodyGroup` の外部インターフェースは
 * `bodyHeight`/`bodyBuild`/`bodyShoulder`(3つのスケール係数)ではなく、`bodyDimensions`/
 * `bodyLayout` が計算済みの生の値そのもの(半径・長さ・Y座標)になっている。
 *
 * 胴体(カプセル)・頭(球)・腕1組・脚1組の4パーツは、それぞれ `bodyTorsoGroup`/
 * `bodyHeadGroup`/`bodyLimbGroup`(腕/脚の2インスタンス)という4つのネストしたグループノード
 * インスタンスへ切り出されている(`bodyTorsoGroupNode.ts`/`bodyHeadGroupNode.ts`/
 * `bodyLimbGroupNode.ts` 参照)。各サブグループは `gen(ジェネレーター)→translate(translateY,
 * Y座標だけを平行移動する汎用ノード)→sceneOut(sceneOutput)` の3ノードだけを内包し、
 * 15種のガーメントグループと同じ「1グループ=1つの描画対象パーツ」という粒度になっている。
 * 以前はこの4パーツの生成チェーンを `bodyGroup` の埋め込みサブグラフに直接フラットに
 * 並べていたが、ガーメント側は「1グループ=1着」という粒度で揃っているのに対し Body だけ
 * 「1グループ=4パーツ」という粗い粒度になっており、他ガーメントの `<name>Group` との粒度が
 * 揃っていなかったため、この形へ分割した。
 *
 * 肌色(`skinColorIn`)は4パーツすべてで共有される値のため、どれか1つのサブグループの内部に
 * 閉じ込めて `groupOutput` で覗き穴を開けるのではなく、`bodyGroup` 自身が持つ
 * `skinColorIn`(`colorInput`)→`material`(`toonMaterial`)から4つのサブグループそれぞれの
 * 外部ソケット `material` へ普通の配線でファンアウトする(`topGroup`/`sleeveGroup` が
 * Torso Radius/Material を共有ノードから受け取るのと同じパターン、`nodes/CLAUDE.md` の
 * 「値が複数グループで共有される場合」参照)。各サブグループが内部の `sceneOutput` で
 * 解決した geometry+material の組は、`groupNodeFactory.ts` の `findResolvedSceneOutputs()`
 * がネストしたグループの内部から自動的に見つけて `bodyGroup` 自身の
 * `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` へ0から振り直して転送する(多段ネスト、
 * `nodes/CLAUDE.md` 参照)ため、`bodyGroup` 自身は `sceneOutput` を1つも持たない。 */
defineGroupNode({
  type: 'bodyGroup',
  label: 'Body',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number', default: 0 },
          { id: 'legRadius', label: 'Leg Radius', type: 'number', default: 0 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0 },
          { id: 'torsoLength', label: 'Torso Length', type: 'number', default: 0 },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0 },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0 },
          { id: 'armLength', label: 'Arm Length', type: 'number', default: 0 },
          { id: 'armRadius', label: 'Arm Radius', type: 'number', default: 0 },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number', default: 0 },
          { id: 'legCenterY', label: 'Leg Center Y', type: 'number', default: 0 },
          { id: 'torsoCenterY', label: 'Torso Center Y', type: 'number', default: 0 },
          { id: 'headCenterY', label: 'Head Center Y', type: 'number', default: 0 },
          { id: 'armCenterY', label: 'Arm Center Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'skinColorIn', type: 'colorInput', data: { hex: '#f2c9a0', label: 'Skin Color' } },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'torsoGroup', type: 'bodyTorsoGroup', data: {} },
    { id: 'headGroup', type: 'bodyHeadGroup', data: {} },
    { id: 'armGroup', type: 'bodyLimbGroup', data: {} },
    { id: 'legGroup', type: 'bodyLimbGroup', data: {} },
  ],
  internalEdges: [
    { source: 'skinColorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },

    { source: 'input', sourceHandle: 'torsoRadius', target: 'torsoGroup', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'torsoLength', target: 'torsoGroup', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'torsoCenterY', target: 'torsoGroup', targetHandle: 'centerY' },
    { source: 'material', sourceHandle: 'material', target: 'torsoGroup', targetHandle: 'material' },

    { source: 'input', sourceHandle: 'headRadius', target: 'headGroup', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'headCenterY', target: 'headGroup', targetHandle: 'centerY' },
    { source: 'material', sourceHandle: 'material', target: 'headGroup', targetHandle: 'material' },

    { source: 'input', sourceHandle: 'armRadius', target: 'armGroup', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'armLength', target: 'armGroup', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'armGroup', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'armCenterY', target: 'armGroup', targetHandle: 'centerY' },
    { source: 'material', sourceHandle: 'material', target: 'armGroup', targetHandle: 'material' },

    { source: 'input', sourceHandle: 'legRadius', target: 'legGroup', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'legHeight', target: 'legGroup', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'legGroup', targetHandle: 'spacing' },
    { source: 'input', sourceHandle: 'legCenterY', target: 'legGroup', targetHandle: 'centerY' },
    { source: 'material', sourceHandle: 'material', target: 'legGroup', targetHandle: 'material' },
  ],
});
