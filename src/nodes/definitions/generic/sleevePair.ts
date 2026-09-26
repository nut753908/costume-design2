import { defineGroupNode } from '../groupNodeFactory';

/** 左右の袖(肩からほぼ真下へ伸びる、先細りの円形断面チューブ)を作るグループノード。`topGroupNode.ts`
 * の Top 本体と結合して使う。
 *
 * 袖は `taperedEllipseTubeGenerator`1本を、原点 `(0, 0, 0)` から
 * `(length × cos(droop), -length × sin(droop), 0)` まで作り、`mirrorPair` で `±spacing`(腕の中心と同じ
 * 肩幅)へ複製して左右の袖にする(左袖は `mirrorPair` 内の `mirrorX` で鏡像反転される)。
 * 終端の直径は始端の 0.85 倍(先細り)。`lengthX`/`lengthDrop` の `factor` は、水平から 88° 下がる
 * 袖の向きの cos/sin(体の脇にまっすぐ下ろした腕の軸に沿わせ、わずかに裾を開く)。
 * 定数(0.85/2 など)は各 `numberMultiply` の入力欄の値。 */
defineGroupNode({
  type: 'sleevePair',
  label: 'Sleeve Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'spacing', label: 'Spacing', type: 'number', default: 0.15 },
          { id: 'sleeveRadius', label: 'Sleeve Radius', type: 'number', default: 0.085 },
          { id: 'sleeveLength', label: 'Sleeve Length', type: 'number', default: 0.22 },
        ],
      },
    },
    { id: 'lengthX', type: 'numberMultiply', data: { factor: Math.cos((88 * Math.PI) / 180) } },
    { id: 'lengthDrop', type: 'numberMultiply', data: { factor: Math.sin((88 * Math.PI) / 180) } },
    { id: 'endY', type: 'numberNegate', data: {} },
    { id: 'startDiameter', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'endDiameter', type: 'numberMultiply', data: { factor: 0.85 } },
    { id: 'gen', type: 'taperedEllipseTubeGenerator', data: { segments: 12 } },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'sleeveLength', target: 'lengthX', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'sleeveLength', target: 'lengthDrop', targetHandle: 'value' },
    { source: 'lengthDrop', sourceHandle: 'value', target: 'endY', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'sleeveRadius', target: 'startDiameter', targetHandle: 'value' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'endDiameter', targetHandle: 'value' },

    // 原点から伸びる袖1本。断面は円(幅=厚み=直径)。
    { source: 'lengthX', sourceHandle: 'value', target: 'gen', targetHandle: 'endX' },
    { source: 'endY', sourceHandle: 'value', target: 'gen', targetHandle: 'endY' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'startWidth' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'startThickness' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'endWidth' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'endThickness' },

    { source: 'gen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'spacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
