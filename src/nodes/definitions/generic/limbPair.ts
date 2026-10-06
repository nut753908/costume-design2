import { defineGroupNode } from '../groupNodeFactory';

/** 腕/脚1本の軸(`armShaft`/`legShaft`、`limbShaft.ts`)を外部入力 `shaft` で、先端の手の球(`limbEnd`)を
 * `end` で受け取って結合し、±spacing だけ X方向に離した左右対称ペアにして Y方向へ配置するグループノード。
 * `bodyGroupNode.ts` が腕1組・脚1組の2箇所で使う。
 *
 * - 根元(上端)の肩/股の丸みは、軸が球の半径ぶん外側まで伸びて自分で丸く閉じるので、関節の球は別に付けない
 *   (付けると、球と軸の太さの違いが継ぎ目の輪になる)。
 * - 先端(下端): `end`(軸の先端が原点の形)を高さ -length/2 へ置く。脚は代わりに `foot`(かかとが原点の形)を
 *   `footY`/`footZ`/`footX`(+が外側)だけずらし、`footPitch`(度)だけ前後へ傾けて置く(脚の `end` は小さな球で隠す)。
 * - `swingAngle`(度)は、付け根(軸の上端の丸みの中心)を支点にして先端を外(+X 側、左右対称ペアの外側)へ
 *   振る角度。支点は動かないので、`centerY`(付け根の高さから決まる位置)は角度によらず有効。`pitchAngle`(度)は
 *   同じ支点で先端を後ろ(-Z)へ振る角度(前へ振るなら負)で、`centerZ` は左右ペア全体の前後位置。 */
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
          { id: 'end', label: 'End', type: 'geometry' },
          { id: 'foot', label: 'Foot', type: 'geometry' },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0 },
          { id: 'centerY', label: 'Center Y', type: 'number', default: 0 },
          { id: 'footY', label: 'Foot Y', type: 'number', default: 0 },
          { id: 'footZ', label: 'Foot Z', type: 'number', default: 0 },
          { id: 'footX', label: 'Foot X', type: 'number', default: 0 },
          { id: 'footPitch', label: 'Foot Pitch (deg)', type: 'number', default: 0 },
          { id: 'swingAngle', label: 'Swing Angle (deg)', type: 'number', default: 0 },
          { id: 'pitchAngle', label: 'Pitch Angle (deg)', type: 'number', default: 0 },
          { id: 'centerZ', label: 'Center Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'halfLength', type: 'numberHalf', data: {} },
    // 先端の球(`end`、軸の先端が原点の形)を軸の先端の高さ(-length/2)へ置く。
    { id: 'endLower', type: 'translate', data: {} },
    // 足(`foot`、かかとが原点の形)を先端の高さに置く: y = -length/2 + footY、z = footZ、x = footX(+が外側、footPitch 度だけ前後へ傾ける)。
    { id: 'footTilt', type: 'rotate', data: {} },
    { id: 'footBaseY', type: 'numberAdd', data: {} },
    { id: 'footTranslate', type: 'translate', data: {} },
    { id: 'negHalfLength', type: 'numberNegate', data: {} },
    { id: 'withJoint', type: 'mergeGeometry', data: {} },
    // 付け根(軸の上端の丸みの中心)を支点に、先端を外(+X 側)へ swingAngle 度だけ振る。
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
    { source: 'input', sourceHandle: 'length', target: 'halfLength', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'end', target: 'endLower', targetHandle: 'geometry' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'endLower', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'shaft', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'endLower', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },
    { source: 'input', sourceHandle: 'foot', target: 'footTilt', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'footPitch', target: 'footTilt', targetHandle: 'x' },
    { source: 'footTilt', sourceHandle: 'geometry', target: 'footTranslate', targetHandle: 'geometry' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'footBaseY', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'footY', target: 'footBaseY', targetHandle: 'b' },
    { source: 'footBaseY', sourceHandle: 'value', target: 'footTranslate', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'footZ', target: 'footTranslate', targetHandle: 'z' },
    { source: 'input', sourceHandle: 'footX', target: 'footTranslate', targetHandle: 'x' },
    { source: 'footTranslate', sourceHandle: 'geometry', target: 'withJoint', targetHandle: 'geometries' },

    { source: 'halfLength', sourceHandle: 'value', target: 'negHalfLength', targetHandle: 'value' },
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
