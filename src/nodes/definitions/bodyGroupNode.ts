import { defineGroupNode } from './groupNodeFactory';

/** Body を他15種のガーメントと同じ「`<name>Group` ノード」パターンで表現する。
 * `Garments.tsx` はノードの型を問わず内部の `sceneOutput` だけを見て描画するため、
 * `bodyGroup` もガーメントと全く同じ経路でシーンへ描画される(ルート CLAUDE.md 参照)。
 *
 * 外部ソケットは `bodyDimensions`/`bodyLayout`(`state/initialGraph.ts` のトップレベル
 * 共有ノード)が計算済みの生の値(半径・長さ・Y座標)そのもので、`bodyGroup` 自身は
 * スケール計算を行わない。
 *
 * 胴体・頭・腕1組・脚1組の4パーツは `bodyTorsoGroup`/`bodyHeadGroup`/`bodyLimbGroup`
 * (腕/脚は2インスタンス)へ切り出されている。各サブグループは `gen(ジェネレーター)→
 * translate(translateY)→sceneOut(sceneOutput)` の3ノードだけを内包し、15種のガーメント
 * グループと同じ「1グループ=1つの描画対象パーツ」という粒度になっている。
 *
 * 肌色(`skinColorIn`)は4パーツすべてで共有される値のため、`bodyGroup` 自身の
 * `skinColorIn`→`material`(`toonMaterial`)から4つのサブグループの外部ソケット `material`
 * へファンアウトする(`nodes/CLAUDE.md` の「値が複数グループで共有される場合」参照)。
 * 各サブグループの `sceneOutput` は多段ネストの転送で `bodyGroup` 自身の出力へ自動的に
 * バブルアップするため、`bodyGroup` 自身は `sceneOutput` を1つも持たない。 */
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
