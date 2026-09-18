import { defineGroupNode } from '../groupNodeFactory';
import type { GraphEdge, GraphNode } from '../../types';

interface ScaleSource {
  id: string;
  handle: string;
}

const BUILD_SCALE: ScaleSource = { id: 'input', handle: 'buildScale' };
const HEIGHT_SCALE: ScaleSource = { id: 'heightScaleIn', handle: 'value' };
const SHOULDER_SCALE: ScaleSource = { id: 'shoulderScaleIn', handle: 'value' };

/** 「基準値(`<name>BaseIn`、numberInput)× スケール → 出力ソケット `<name>`」の3点セットを
 * 生成する。`scale` に渡したノード/ソケットが `<name>Scale`(numberMultiply)の `factor` になる。
 * `preScale` を渡すと、基準値にまず `preScale` を掛けた `preScale.id`(numberMultiply)を
 * 挟んでから `scale` を掛ける(shoulderSpacing が Build と Shoulder の両方を受ける場合)。 */
function dimension(config: {
  name: string;
  label: string;
  base: { value: number; min: number; max: number; step: number };
  scale: ScaleSource;
  preScale?: { id: string; label: string; source: ScaleSource };
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const { name, label, base, scale, preScale } = config;
  const baseId = `${name}BaseIn`;
  const scaleId = `${name}Scale`;
  const nodes: GraphNode[] = [
    { id: baseId, type: 'numberInput', data: { ...base, label: `${label} Base` } },
    { id: scaleId, type: 'numberMultiply', data: { label } },
  ];
  const edges: GraphEdge[] = [];
  let valueSource = baseId;
  if (preScale) {
    nodes.push({ id: preScale.id, type: 'numberMultiply', data: { label: preScale.label } });
    edges.push(
      { source: baseId, sourceHandle: 'value', target: preScale.id, targetHandle: 'value' },
      { source: preScale.source.id, sourceHandle: preScale.source.handle, target: preScale.id, targetHandle: 'factor' },
    );
    valueSource = preScale.id;
  }
  edges.push(
    { source: valueSource, sourceHandle: 'value', target: scaleId, targetHandle: 'value' },
    { source: scale.id, sourceHandle: scale.handle, target: scaleId, targetHandle: 'factor' },
    { source: scaleId, sourceHandle: 'value', target: 'output', targetHandle: name },
  );
  return { nodes, edges };
}

const dimensions = [
  dimension({ name: 'legHeight', label: 'Leg Height', base: { value: 0.85, min: 0.5, max: 1.2, step: 0.01 }, scale: HEIGHT_SCALE }),
  dimension({ name: 'legRadius', label: 'Leg Radius', base: { value: 0.11, min: 0.05, max: 0.2, step: 0.005 }, scale: BUILD_SCALE }),
  dimension({ name: 'legSpacing', label: 'Leg Spacing', base: { value: 0.14, min: 0.05, max: 0.3, step: 0.005 }, scale: BUILD_SCALE }),
  dimension({ name: 'torsoLength', label: 'Torso Length', base: { value: 0.55, min: 0.3, max: 0.9, step: 0.01 }, scale: HEIGHT_SCALE }),
  dimension({ name: 'torsoRadius', label: 'Torso Radius', base: { value: 0.26, min: 0.15, max: 0.4, step: 0.01 }, scale: BUILD_SCALE }),
  dimension({ name: 'armLength', label: 'Arm Length', base: { value: 0.62, min: 0.4, max: 0.9, step: 0.01 }, scale: HEIGHT_SCALE }),
  dimension({ name: 'armRadius', label: 'Arm Radius', base: { value: 0.075, min: 0.03, max: 0.15, step: 0.005 }, scale: BUILD_SCALE }),
  // shoulderSpacing = shoulderSpacingBase * buildScale * shoulderScale
  dimension({
    name: 'shoulderSpacing',
    label: 'Shoulder Spacing',
    base: { value: 0.34, min: 0.2, max: 0.5, step: 0.01 },
    scale: SHOULDER_SCALE,
    preScale: { id: 'shoulderSpacingBuildScale', label: 'Shoulder Spacing × Build', source: BUILD_SCALE },
  }),
];

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyDimensions`)として
 * ただ1組だけ存在し、`bodyGroup` と全15ガーメントへファンアウトされる計算グループ —
 * Height/Build/Shoulder スケールから各部位の半径・長さを求める9つの「基準値
 * (`numberInput`)→ `numberMultiply`」チェーンを1枚にまとめたもの。ガーメントの『体に
 * 触れる半径』(`waistRadiusIn → numberMultiply(bodyBuild) → generator`)と同じ粒度まで
 * ノードグラフ上に展開しており、ダブルクリックで中に入れば実際の四則演算グラフが
 * そのまま見える(`nodes/CLAUDE.md` の「グループノード」節参照)。Height/Shoulder は
 * `bodyDimensions` からしか参照されない単独パラメータのため、`buildScale`(9ガーメントへ
 * 直接ファンアウトする共有値、外部ソケットのまま)とは異なりグループ内部の `numberInput`
 * (`heightScaleIn`/`shoulderScaleIn`)として持つ。 */
defineGroupNode({
  type: 'bodyDimensionsGroup',
  label: 'Body Dimensions',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'buildScale', label: 'Build Scale', type: 'number', default: 1 }],
      },
    },
    { id: 'heightScaleIn', type: 'numberInput', data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
    { id: 'shoulderScaleIn', type: 'numberInput', data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },
    // headRadius はスケール無し(基準値がそのまま出力になる)。
    { id: 'headRadiusBaseIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Head Radius Base' } },
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
          { id: 'headRadius', label: 'Head Radius', type: 'number' },
          { id: 'armLength', label: 'Arm Length', type: 'number' },
          { id: 'armRadius', label: 'Arm Radius', type: 'number' },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'headRadiusBaseIn', sourceHandle: 'value', target: 'output', targetHandle: 'headRadius' },
    ...dimensions.flatMap((d) => d.edges),
  ],
});
