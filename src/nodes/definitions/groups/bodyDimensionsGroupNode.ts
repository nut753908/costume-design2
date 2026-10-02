import { defineGroupNode } from '../groupNodeFactory';
import type { GraphEdge, GraphNode } from '../../types';

/** スケールの供給元(配線するノード/ソケットの出力)。 */
interface ScaleSource {
  id: string;
  handle: string;
}

const BUILD_SCALE: ScaleSource = { id: 'input', handle: 'buildScale' };
const HEIGHT_SCALE: ScaleSource = { id: 'input', handle: 'heightScale' };
const SHOULDER_SCALE: ScaleSource = { id: 'input', handle: 'shoulderScale' };

/** 「基準値 × スケール → 出力ソケット `<name>`」の `<name>Scale`(numberMultiply)を生成する。
 * 基準値は `<name>Scale` の `value` 入力欄の値で、`scale` の出力が `factor` へ配線される。
 * `preScale` を渡すと、基準値にまず `preScale.source` を掛ける `preScale.id`(numberMultiply)を
 * 挟んでから `scale` を掛ける(shoulderSpacing が Build と Shoulder の両方を受ける場合)。 */
function dimension(config: {
  name: string;
  base: number;
  scale: ScaleSource;
  preScale?: { id: string; source: ScaleSource };
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const { name, base, scale, preScale } = config;
  const scaleId = `${name}Scale`;
  const factorEdge = (source: ScaleSource, target: string): GraphEdge => ({
    source: source.id,
    sourceHandle: source.handle,
    target,
    targetHandle: 'factor',
  });
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  if (preScale) {
    nodes.push({ id: preScale.id, type: 'numberMultiply', data: { value: base } }, { id: scaleId, type: 'numberMultiply', data: {} });
    edges.push(
      factorEdge(preScale.source, preScale.id),
      { source: preScale.id, sourceHandle: 'value', target: scaleId, targetHandle: 'value' },
      factorEdge(scale, scaleId),
    );
  } else {
    nodes.push({ id: scaleId, type: 'numberMultiply', data: { value: base } });
    edges.push(factorEdge(scale, scaleId));
  }
  edges.push({ source: scaleId, sourceHandle: 'value', target: 'output', targetHandle: name });
  return { nodes, edges };
}

const dimensions = [
  dimension({ name: 'legHeight', base: 0.5754, scale: HEIGHT_SCALE }),
  dimension({ name: 'legRadius', base: 0.0691, scale: BUILD_SCALE }),
  dimension({ name: 'legSpacing', base: 0.1109, scale: BUILD_SCALE }),
  dimension({ name: 'torsoLength', base: 0.3343, scale: HEIGHT_SCALE }),
  dimension({ name: 'torsoRadius', base: 0.1536, scale: BUILD_SCALE }),
  dimension({ name: 'armLength', base: 0.4683, scale: HEIGHT_SCALE }),
  dimension({ name: 'neckLength', base: 0.0565, scale: HEIGHT_SCALE }),
  dimension({ name: 'neckRadius', base: 0.0525, scale: BUILD_SCALE }),
  dimension({ name: 'armRadius', base: 0.0523, scale: BUILD_SCALE }),
  // shoulderSpacing = shoulderSpacingBase * buildScale * shoulderScale
  dimension({
    name: 'shoulderSpacing',
    base: 0.1443,
    scale: SHOULDER_SCALE,
    preScale: { id: 'shoulderSpacingBuildScale', source: BUILD_SCALE },
  }),
];

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyDimensions`)として
 * ただ1組だけ存在し、`bodyGroup` と全14ガーメントへファンアウトされる計算グループ —
 * Height/Build/Shoulder スケール(外部ソケット `heightScale`/`buildScale`/`shoulderScale`)から
 * 各部位の半径・長さを求める11個の「基準値 × スケール」の `numberMultiply`(基準値は `Value` 入力欄
 * の値)を1枚にまとめたもの。ガーメントの『体に触れる半径』(`bodyRadiusScale()` の
 * `numberMultiply`)と同じ粒度までノードグラフ上に展開しており、「→」ボタンで中に入れば
 * 実際の四則演算グラフがそのまま見える(`nodes/CLAUDE.md` の「グループノード」節参照)。
 * Height/Shoulder スケールは、ルートで配線するのではなく、グループカードの
 * 入力欄(未接続時の既定値 1)から調整する。`headRadius` はスケール無しで、`groupOutput` の
 * `headRadius` の入力欄の値(0.2966)がそのまま出力になる。 */
defineGroupNode({
  type: 'bodyDimensionsGroup',
  label: 'Body Dimensions',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'buildScale', label: 'Build Scale', type: 'number', default: 1 },
          { id: 'heightScale', label: 'Height Scale', type: 'number', default: 1 },
          { id: 'shoulderScale', label: 'Shoulder Scale', type: 'number', default: 1 },
        ],
      },
    },
    ...dimensions.flatMap((d) => d.nodes),
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number' },
          { id: 'legRadius', label: 'Leg Radius', type: 'number' },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
          { id: 'torsoLength', label: 'Torso Length', type: 'number' },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.2966 },
          { id: 'armLength', label: 'Arm Length', type: 'number' },
          { id: 'armRadius', label: 'Arm Radius', type: 'number' },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number' },
          { id: 'neckLength', label: 'Neck Length', type: 'number' },
          { id: 'neckRadius', label: 'Neck Radius', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    ...dimensions.flatMap((d) => d.edges),
  ],
});
