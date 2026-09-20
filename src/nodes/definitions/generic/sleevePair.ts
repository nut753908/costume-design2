import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** 左右の袖(肩から斜め下へ伸びる、先細りの円形断面チューブ)を作るグループノード。`topGroupNode.ts`
 * の Top 本体と結合して使う。
 *
 * 袖は `taperedTubeGenerator`(楕円断面)1本を、原点 `(0, 0, 0)` から
 * `(length × cos(droop), -length × sin(droop), 0)` まで作り、`mirrorPair` で `±startX` へ複製して
 * 左右の袖にする(左袖は `mirrorPair` 内の `mirrorX` で鏡像反転される)。`startX` は胴体の壁より
 * 少し内側(`attachRadius × insetIn`)にして、浮かずに壁と重なるようにする(ブーリアン演算や
 * 穴あけはせず、意図的な交差のみ)。終端の直径は始端の `taperIn` 倍(先細り)。
 * `cosDroopIn`/`sinDroopIn` は水平から 36°(π/5)下がる袖の向きの cos/sin。
 * (`constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」) */
defineGroupNode({
  type: 'sleevePair',
  label: 'Sleeves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'attachRadius', label: 'Attach Radius', type: 'number', default: 0.29 },
          { id: 'sleeveRadius', label: 'Sleeve Radius', type: 'number', default: 0.085 },
          { id: 'sleeveLength', label: 'Sleeve Length', type: 'number', default: 0.22 },
        ],
      },
    },
    constNumberInput('zeroIn', 0),
    constNumberInput('twoIn', 2),
    constNumberInput('insetIn', 0.75),
    constNumberInput('taperIn', 0.85),
    constNumberInput('cosDroopIn', Math.cos(Math.PI / 5)),
    constNumberInput('sinDroopIn', Math.sin(Math.PI / 5)),

    { id: 'startX', type: 'numberMultiply', data: {} },
    { id: 'lengthX', type: 'numberMultiply', data: {} },
    { id: 'lengthDrop', type: 'numberMultiply', data: {} },
    { id: 'endY', type: 'numberNegate', data: {} },
    { id: 'startDiameter', type: 'numberMultiply', data: {} },
    { id: 'endDiameter', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'taperedTubeGenerator', data: { shape: 'ellipse', segments: 12 } },
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
    { source: 'input', sourceHandle: 'attachRadius', target: 'startX', targetHandle: 'value' },
    { source: 'insetIn', sourceHandle: 'value', target: 'startX', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'sleeveLength', target: 'lengthX', targetHandle: 'value' },
    { source: 'cosDroopIn', sourceHandle: 'value', target: 'lengthX', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'sleeveLength', target: 'lengthDrop', targetHandle: 'value' },
    { source: 'sinDroopIn', sourceHandle: 'value', target: 'lengthDrop', targetHandle: 'factor' },
    { source: 'lengthDrop', sourceHandle: 'value', target: 'endY', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'sleeveRadius', target: 'startDiameter', targetHandle: 'value' },
    { source: 'twoIn', sourceHandle: 'value', target: 'startDiameter', targetHandle: 'factor' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'endDiameter', targetHandle: 'value' },
    { source: 'taperIn', sourceHandle: 'value', target: 'endDiameter', targetHandle: 'factor' },

    // 原点から伸びる袖1本。断面は円(幅=厚み=直径)。
    { source: 'zeroIn', sourceHandle: 'value', target: 'gen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'gen', targetHandle: 'startY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'gen', targetHandle: 'startZ' },
    { source: 'lengthX', sourceHandle: 'value', target: 'gen', targetHandle: 'endX' },
    { source: 'endY', sourceHandle: 'value', target: 'gen', targetHandle: 'endY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'gen', targetHandle: 'endZ' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'startWidth' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'startThickness' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'endWidth' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'gen', targetHandle: 'endThickness' },

    { source: 'gen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'startX', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
