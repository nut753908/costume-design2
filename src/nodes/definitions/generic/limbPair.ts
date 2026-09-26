import { defineGroupNode } from '../groupNodeFactory';

/** 手首/足首側を根元よりわずかに細くしたテーパー円柱1本を、±spacing だけ X方向に離した左右
 * 対称ペアにして Y方向へ配置するグループノード。`bodyGroupNode.ts` が腕1組・脚1組の
 * 2箇所で使う(同じ4段の構成が2回並ぶ重複をまとめたもの)。
 *
 * 根元の半径 `radius` はそのまま `cylinderGenerator.radiusTop` へ、`taperRatio` を掛けた値を
 * `radiusBottom` へ渡す(`taper`、`numberMultiply`)。`taperRatio` は腕と脚で別々の値を
 * 持てるよう、このグループの内部ではなく呼び出し側(`bodyGroup`)の `numberInput` から外部
 * ソケットとして受け取る。
 *
 * 根元(上端)には `radius` の球(`joint`)を結合し、円柱の平らな切り口をふさいで肩/股の丸みに
 * つなぐ(切り口のままだと、なで肩や腰の丸みの外側に平らな面が浮いて見える)。
 *
 * 先端(下端)には手/足になる球(`end`)を結合する。半径は `radius × endRatio`、`endScaleY`/`endScaleZ`
 * で上下・前後につぶし/伸ばし、中心を先端から `endShiftY`/`endShiftZ`(端の球の半径を単位にした量)
 * だけずらす。腕(手)と脚(足)で形が違うので、どれも呼び出し側(`bodyGroup`)の入力欄の値で持つ。 */
defineGroupNode({
  type: 'limbPair',
  label: 'Limb Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'taperRatio', label: 'Taper Ratio', type: 'number', default: 1 },
          { id: 'endRatio', label: 'End Ratio', type: 'number', default: 1 },
          { id: 'endScaleY', label: 'End Scale Y', type: 'number', default: 1 },
          { id: 'endScaleZ', label: 'End Scale Z', type: 'number', default: 1 },
          { id: 'endShiftY', label: 'End Shift Y', type: 'number', default: 0 },
          { id: 'endShiftZ', label: 'End Shift Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'taper', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'cylinderGenerator', data: {} },
    { id: 'joint', type: 'sphereGenerator', data: {} },
    { id: 'halfLength', type: 'numberHalf', data: {} },
    { id: 'jointTranslate', type: 'translate', data: {} },
    // 先端の球: 中心 = (0, -length/2 + endRadius × endShiftY, endRadius × endShiftZ)
    { id: 'endRadius', type: 'numberMultiply', data: {} },
    { id: 'end', type: 'sphereGenerator', data: {} },
    { id: 'endScale', type: 'scale', data: {} },
    { id: 'negHalfLength', type: 'numberNegate', data: {} },
    { id: 'endLift', type: 'numberMultiply', data: {} },
    { id: 'endY', type: 'numberAdd', data: {} },
    { id: 'endZ', type: 'numberMultiply', data: {} },
    { id: 'endTranslate', type: 'translate', data: {} },
    { id: 'withJoint', type: 'mergeGeometry', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'translate', type: 'translate', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'gen', targetHandle: 'radiusTop' },
    { source: 'input', sourceHandle: 'radius', target: 'taper', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'taperRatio', target: 'taper', targetHandle: 'factor' },
    { source: 'taper', sourceHandle: 'value', target: 'gen', targetHandle: 'radiusBottom' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'height' },
    { source: 'input', sourceHandle: 'radius', target: 'joint', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'length', target: 'halfLength', targetHandle: 'value' },
    { source: 'joint', sourceHandle: 'geometry', target: 'jointTranslate', targetHandle: 'geometry' },
    { source: 'halfLength', sourceHandle: 'value', target: 'jointTranslate', targetHandle: 'y' },
    { source: 'gen', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'jointTranslate', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'endTranslate', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },

    { source: 'input', sourceHandle: 'radius', target: 'endRadius', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endRatio', target: 'endRadius', targetHandle: 'factor' },
    { source: 'endRadius', sourceHandle: 'value', target: 'end', targetHandle: 'radius' },
    { source: 'end', sourceHandle: 'geometry', target: 'endScale', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'endScaleY', target: 'endScale', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'endScaleZ', target: 'endScale', targetHandle: 'z' },
    { source: 'halfLength', sourceHandle: 'value', target: 'negHalfLength', targetHandle: 'value' },
    { source: 'endRadius', sourceHandle: 'value', target: 'endLift', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endShiftY', target: 'endLift', targetHandle: 'factor' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'endY', targetHandle: 'a' },
    { source: 'endLift', sourceHandle: 'value', target: 'endY', targetHandle: 'b' },
    { source: 'endRadius', sourceHandle: 'value', target: 'endZ', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endShiftZ', target: 'endZ', targetHandle: 'factor' },
    { source: 'endScale', sourceHandle: 'geometry', target: 'endTranslate', targetHandle: 'geometry' },
    { source: 'endY', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'y' },
    { source: 'endZ', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'z' },
    { source: 'withJoint', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'spacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
