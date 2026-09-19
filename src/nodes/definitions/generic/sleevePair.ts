import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** 左右の袖(肩から斜め下へ伸びる、先細りの円形断面チューブ)を作るグループノード。`topGroupNode.ts`
 * の Top 本体と結合して使う。
 *
 * 右袖は `taperedTubeGenerator`(楕円断面)で、始点 `(startX, 0, 0)` から終点
 * `(startX + length × cos(droop), -length × sin(droop), 0)` まで作る。`startX` は胴体の壁より
 * 少し内側(`attachRadius × insetIn`)にして、浮かずに壁と重なるようにする(ブーリアン演算や
 * 穴あけはせず、意図的な交差のみ)。左袖は X の符号を反転しただけの鏡像(`mirrorPair` は
 * 平行移動しかしないため使えず、始点・終点の X を `numberNegate` で反転した別のチューブとして
 * 作る)。終端の直径は始端の `taperIn` 倍(先細り)。
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
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('twoIn', 2, 'Two (Radius → Diameter)'),
    constNumberInput('insetIn', 0.75, 'Attach Inset'),
    constNumberInput('taperIn', 0.85, 'End Taper'),
    constNumberInput('cosDroopIn', Math.cos(Math.PI / 5), 'cos(Droop 36°)'),
    constNumberInput('sinDroopIn', Math.sin(Math.PI / 5), 'sin(Droop 36°)'),

    { id: 'startX', type: 'numberMultiply', data: { label: 'Start X (Attach Radius × Inset)' } },
    { id: 'lengthX', type: 'numberMultiply', data: { label: 'Length × cos(Droop)' } },
    { id: 'endX', type: 'numberAdd', data: { label: 'End X' } },
    { id: 'lengthDrop', type: 'numberMultiply', data: { label: 'Length × sin(Droop)' } },
    { id: 'endY', type: 'numberNegate', data: { label: 'End Y' } },
    { id: 'startDiameter', type: 'numberMultiply', data: { label: 'Start Diameter' } },
    { id: 'endDiameter', type: 'numberMultiply', data: { label: 'End Diameter' } },
    { id: 'negatedStartX', type: 'numberNegate', data: { label: 'Negated Start X' } },
    { id: 'negatedEndX', type: 'numberNegate', data: { label: 'Negated End X' } },
    { id: 'rightGen', type: 'taperedTubeGenerator', data: { shape: 'ellipse', segments: 12 } },
    { id: 'leftGen', type: 'taperedTubeGenerator', data: { shape: 'ellipse', segments: 12 } },
    { id: 'merge', type: 'mergeGeometry', data: {} },
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
    { source: 'startX', sourceHandle: 'value', target: 'endX', targetHandle: 'a' },
    { source: 'lengthX', sourceHandle: 'value', target: 'endX', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'sleeveLength', target: 'lengthDrop', targetHandle: 'value' },
    { source: 'sinDroopIn', sourceHandle: 'value', target: 'lengthDrop', targetHandle: 'factor' },
    { source: 'lengthDrop', sourceHandle: 'value', target: 'endY', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'sleeveRadius', target: 'startDiameter', targetHandle: 'value' },
    { source: 'twoIn', sourceHandle: 'value', target: 'startDiameter', targetHandle: 'factor' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'endDiameter', targetHandle: 'value' },
    { source: 'taperIn', sourceHandle: 'value', target: 'endDiameter', targetHandle: 'factor' },
    { source: 'startX', sourceHandle: 'value', target: 'negatedStartX', targetHandle: 'value' },
    { source: 'endX', sourceHandle: 'value', target: 'negatedEndX', targetHandle: 'value' },

    // 右袖(+X 側)。断面は円(幅=厚み=直径)。
    { source: 'startX', sourceHandle: 'value', target: 'rightGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'rightGen', targetHandle: 'startY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'rightGen', targetHandle: 'startZ' },
    { source: 'endX', sourceHandle: 'value', target: 'rightGen', targetHandle: 'endX' },
    { source: 'endY', sourceHandle: 'value', target: 'rightGen', targetHandle: 'endY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'rightGen', targetHandle: 'endZ' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'rightGen', targetHandle: 'startWidth' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'rightGen', targetHandle: 'startThickness' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'rightGen', targetHandle: 'endWidth' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'rightGen', targetHandle: 'endThickness' },

    // 左袖(-X 側)。X だけ符号反転。
    { source: 'negatedStartX', sourceHandle: 'value', target: 'leftGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'leftGen', targetHandle: 'startY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'leftGen', targetHandle: 'startZ' },
    { source: 'negatedEndX', sourceHandle: 'value', target: 'leftGen', targetHandle: 'endX' },
    { source: 'endY', sourceHandle: 'value', target: 'leftGen', targetHandle: 'endY' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'leftGen', targetHandle: 'endZ' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'leftGen', targetHandle: 'startWidth' },
    { source: 'startDiameter', sourceHandle: 'value', target: 'leftGen', targetHandle: 'startThickness' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'leftGen', targetHandle: 'endWidth' },
    { source: 'endDiameter', sourceHandle: 'value', target: 'leftGen', targetHandle: 'endThickness' },

    { source: 'rightGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'leftGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'merge', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
