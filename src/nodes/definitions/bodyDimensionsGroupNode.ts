import { defineGroupNode } from './groupNodeFactory';

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyDimensions`)として
 * ただ1組だけ存在し、`bodyGroup` と全15ガーメントへファンアウトされる計算グループ —
 * Height/Build/Shoulder スケールから各部位の半径・長さを求める9つの「基準値
 * (`numberInput`)→ `numberMultiply`」チェーンを1枚にまとめたもの。ガーメントの『体に
 * 触れる半径』(`waistRadiusIn → numberMultiply(bodyBuild) → generator`)と同じ粒度まで
 * ノードグラフ上に展開しており、ダブルクリックで中に入れば実際の四則演算グラフが
 * そのまま見える(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
defineGroupNode({
  type: 'bodyDimensionsGroup',
  label: 'Body Dimensions',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'heightScale', label: 'Height Scale', type: 'number', default: 1 },
          { id: 'buildScale', label: 'Build Scale', type: 'number', default: 1 },
          { id: 'shoulderScale', label: 'Shoulder Scale', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'legHeightBaseIn', type: 'numberInput', data: { value: 0.85, min: 0.5, max: 1.2, step: 0.01, label: 'Leg Height Base' } },
    { id: 'legHeightScale', type: 'numberMultiply', data: { label: 'Leg Height' } },
    { id: 'legRadiusBaseIn', type: 'numberInput', data: { value: 0.11, min: 0.05, max: 0.2, step: 0.005, label: 'Leg Radius Base' } },
    { id: 'legRadiusScale', type: 'numberMultiply', data: { label: 'Leg Radius' } },
    { id: 'legSpacingBaseIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.3, step: 0.005, label: 'Leg Spacing Base' } },
    { id: 'legSpacingScale', type: 'numberMultiply', data: { label: 'Leg Spacing' } },
    { id: 'torsoLengthBaseIn', type: 'numberInput', data: { value: 0.55, min: 0.3, max: 0.9, step: 0.01, label: 'Torso Length Base' } },
    { id: 'torsoLengthScale', type: 'numberMultiply', data: { label: 'Torso Length' } },
    { id: 'torsoRadiusBaseIn', type: 'numberInput', data: { value: 0.26, min: 0.15, max: 0.4, step: 0.01, label: 'Torso Radius Base' } },
    { id: 'torsoRadiusScale', type: 'numberMultiply', data: { label: 'Torso Radius' } },
    { id: 'headRadiusBaseIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Head Radius Base' } },
    { id: 'armLengthBaseIn', type: 'numberInput', data: { value: 0.62, min: 0.4, max: 0.9, step: 0.01, label: 'Arm Length Base' } },
    { id: 'armLengthScale', type: 'numberMultiply', data: { label: 'Arm Length' } },
    { id: 'armRadiusBaseIn', type: 'numberInput', data: { value: 0.075, min: 0.03, max: 0.15, step: 0.005, label: 'Arm Radius Base' } },
    { id: 'armRadiusScale', type: 'numberMultiply', data: { label: 'Arm Radius' } },
    { id: 'shoulderSpacingBaseIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Shoulder Spacing Base' } },
    { id: 'shoulderSpacingBuildScale', type: 'numberMultiply', data: { label: 'Shoulder Spacing × Build' } },
    { id: 'shoulderSpacingScale', type: 'numberMultiply', data: { label: 'Shoulder Spacing' } },
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
    // legHeight = legHeightBase * heightScale
    { source: 'legHeightBaseIn', sourceHandle: 'value', target: 'legHeightScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'legHeightScale', targetHandle: 'factor' },
    { source: 'legHeightScale', sourceHandle: 'value', target: 'output', targetHandle: 'legHeight' },
    // legRadius = legRadiusBase * buildScale
    { source: 'legRadiusBaseIn', sourceHandle: 'value', target: 'legRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'legRadiusScale', targetHandle: 'factor' },
    { source: 'legRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'legRadius' },
    // legSpacing = legSpacingBase * buildScale
    { source: 'legSpacingBaseIn', sourceHandle: 'value', target: 'legSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'legSpacingScale', targetHandle: 'factor' },
    { source: 'legSpacingScale', sourceHandle: 'value', target: 'output', targetHandle: 'legSpacing' },
    // torsoLength = torsoLengthBase * heightScale
    { source: 'torsoLengthBaseIn', sourceHandle: 'value', target: 'torsoLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'torsoLengthScale', targetHandle: 'factor' },
    { source: 'torsoLengthScale', sourceHandle: 'value', target: 'output', targetHandle: 'torsoLength' },
    // torsoRadius = torsoRadiusBase * buildScale
    { source: 'torsoRadiusBaseIn', sourceHandle: 'value', target: 'torsoRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'torsoRadiusScale', targetHandle: 'factor' },
    { source: 'torsoRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'torsoRadius' },
    // headRadius はスケール無し
    { source: 'headRadiusBaseIn', sourceHandle: 'value', target: 'output', targetHandle: 'headRadius' },
    // armLength = armLengthBase * heightScale
    { source: 'armLengthBaseIn', sourceHandle: 'value', target: 'armLengthScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightScale', target: 'armLengthScale', targetHandle: 'factor' },
    { source: 'armLengthScale', sourceHandle: 'value', target: 'output', targetHandle: 'armLength' },
    // armRadius = armRadiusBase * buildScale
    { source: 'armRadiusBaseIn', sourceHandle: 'value', target: 'armRadiusScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'armRadiusScale', targetHandle: 'factor' },
    { source: 'armRadiusScale', sourceHandle: 'value', target: 'output', targetHandle: 'armRadius' },
    // shoulderSpacing = shoulderSpacingBase * buildScale * shoulderScale
    { source: 'shoulderSpacingBaseIn', sourceHandle: 'value', target: 'shoulderSpacingBuildScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'buildScale', target: 'shoulderSpacingBuildScale', targetHandle: 'factor' },
    { source: 'shoulderSpacingBuildScale', sourceHandle: 'value', target: 'shoulderSpacingScale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'shoulderScale', target: 'shoulderSpacingScale', targetHandle: 'factor' },
    { source: 'shoulderSpacingScale', sourceHandle: 'value', target: 'output', targetHandle: 'shoulderSpacing' },
  ],
});
