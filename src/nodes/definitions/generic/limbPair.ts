import { defineGroupNode } from '../groupNodeFactory';

/** 腕/脚1本の軸(`armShaft`/`legShaft`、`limbShaft.ts`)を外部入力 `shaft` で受け取り、付け根の関節の球と先端の
 * 手/足の球を結合して、±spacing だけ X方向に離した左右対称ペアにして Y方向へ配置するグループノード。
 * `bodyGroupNode.ts` が腕1組・脚1組の2箇所で使う。
 *
 * 根元(上端)には `radius` の球(`joint`)を結合し、軸の切り口をふさいで肩/股の丸みにつなぐ。先端(下端)には
 * 手/足になる球(`end`)を結合する。半径は `radius × endRatio`、`endScaleX`/`endScaleY`/`endScaleZ` で幅・上下・前後に
 * つぶし/伸ばし、`endPitch`(度)で前後へ傾け、中心を先端から `endShiftY`/`endShiftZ`(端の球の半径を単位にした量)
 * だけずらす。腕(手)と脚(足)で形が違うので、どれも呼び出し側(`bodyGroup`)の入力欄の値で持つ。
 *
 * `swingAngle`(度)は、付け根(関節の球の中心)を支点にして先端を外(+X 側、左右対称ペアの外側)へ振る角度。
 * 支点は動かないので、`centerY`(付け根の高さから決まる位置)は角度によらず有効。`pitchAngle`(度)は同じ支点で
 * 先端を後ろ(-Z)へ振る角度(前へ振るなら負)で、`centerZ` は左右ペア全体の前後位置。 */
defineGroupNode({
  type: 'limbPair',
  label: 'Limb Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'shaft', label: 'Shaft', type: 'geometry' },
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'endRatio', label: 'End Ratio', type: 'number', default: 1 },
          { id: 'endScaleX', label: 'End Scale X', type: 'number', default: 1 },
          { id: 'endScaleY', label: 'End Scale Y', type: 'number', default: 1 },
          { id: 'endScaleZ', label: 'End Scale Z', type: 'number', default: 1 },
          { id: 'endPitch', label: 'End Pitch (deg)', type: 'number', default: 0 },
          { id: 'endShiftY', label: 'End Shift Y', type: 'number', default: 0 },
          { id: 'endShiftZ', label: 'End Shift Z', type: 'number', default: 0 },
          { id: 'swingAngle', label: 'Swing Angle (deg)', type: 'number', default: 0 },
          { id: 'pitchAngle', label: 'Pitch Angle (deg)', type: 'number', default: 0 },
          { id: 'centerZ', label: 'Center Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'joint', type: 'sphereGenerator', data: {} },
    { id: 'halfLength', type: 'numberHalf', data: {} },
    { id: 'jointTranslate', type: 'translate', data: {} },
    // 先端の球: 中心 = (0, -length/2 + endRadius × endShiftY, endRadius × endShiftZ)
    { id: 'endRadius', type: 'numberMultiply', data: {} },
    { id: 'end', type: 'sphereGenerator', data: {} },
    { id: 'endScale', type: 'scale', data: {} },
    { id: 'endTilt', type: 'rotate', data: {} },
    { id: 'negHalfLength', type: 'numberNegate', data: {} },
    { id: 'endLift', type: 'numberMultiply', data: {} },
    { id: 'endY', type: 'numberAdd', data: {} },
    { id: 'endZ', type: 'numberMultiply', data: {} },
    { id: 'endTranslate', type: 'translate', data: {} },
    { id: 'withJoint', type: 'mergeGeometry', data: {} },
    // 付け根(関節の球の中心)を支点に、先端を外(+X 側)へ swingAngle 度だけ振る。
    { id: 'pivotDown', type: 'translate', data: {} },
    { id: 'swing', type: 'rotate', data: {} },
    { id: 'pivotUp', type: 'translate', data: {} },
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
    { source: 'input', sourceHandle: 'radius', target: 'joint', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'length', target: 'halfLength', targetHandle: 'value' },
    { source: 'joint', sourceHandle: 'geometry', target: 'jointTranslate', targetHandle: 'geometry' },
    { source: 'halfLength', sourceHandle: 'value', target: 'jointTranslate', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'shaft', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'jointTranslate', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'endTranslate', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },

    { source: 'input', sourceHandle: 'radius', target: 'endRadius', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endRatio', target: 'endRadius', targetHandle: 'factor' },
    { source: 'endRadius', sourceHandle: 'value', target: 'end', targetHandle: 'radius' },
    { source: 'end', sourceHandle: 'geometry', target: 'endScale', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'endScaleX', target: 'endScale', targetHandle: 'x' },
    { source: 'input', sourceHandle: 'endScaleY', target: 'endScale', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'endScaleZ', target: 'endScale', targetHandle: 'z' },
    { source: 'halfLength', sourceHandle: 'value', target: 'negHalfLength', targetHandle: 'value' },
    { source: 'endRadius', sourceHandle: 'value', target: 'endLift', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endShiftY', target: 'endLift', targetHandle: 'factor' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'endY', targetHandle: 'a' },
    { source: 'endLift', sourceHandle: 'value', target: 'endY', targetHandle: 'b' },
    { source: 'endRadius', sourceHandle: 'value', target: 'endZ', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'endShiftZ', target: 'endZ', targetHandle: 'factor' },
    { source: 'endScale', sourceHandle: 'geometry', target: 'endTilt', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'endPitch', target: 'endTilt', targetHandle: 'x' },
    { source: 'endTilt', sourceHandle: 'geometry', target: 'endTranslate', targetHandle: 'geometry' },
    { source: 'endY', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'y' },
    { source: 'endZ', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'z' },
    { source: 'withJoint', sourceHandle: 'geometry', target: 'pivotDown', targetHandle: 'geometry' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'pivotDown', targetHandle: 'y' },
    { source: 'pivotDown', sourceHandle: 'geometry', target: 'swing', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'swingAngle', target: 'swing', targetHandle: 'z' },
    { source: 'input', sourceHandle: 'pitchAngle', target: 'swing', targetHandle: 'x' },
    { source: 'swing', sourceHandle: 'geometry', target: 'pivotUp', targetHandle: 'geometry' },
    { source: 'halfLength', sourceHandle: 'value', target: 'pivotUp', targetHandle: 'y' },
    { source: 'pivotUp', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'spacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'translate', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'centerY', target: 'translate', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'centerZ', target: 'translate', targetHandle: 'z' },
    { source: 'translate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
