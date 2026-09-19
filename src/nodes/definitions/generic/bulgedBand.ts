import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** アンカー(上端、radius)から下端(radius)まで、中間で bulge 倍に膨らむ帯状の回転体を作る
 * グループノード。上半分・下半分それぞれの `easedLatheProfile` の結果を連結して Lathe 化する。
 * `beltGroupNode.ts`(Bulge 可変)と `scarfGroupNode.ts`(首元の輪、Bulge 固定)が共有する。
 *   - `bulgeRadiusCalc`(`numberMultiply`、`radius × bulge`)
 *   - `halfCalc`(`numberHalf`、`thickness × 0.5`)
 *   - `lowerProfile`(`bulgeRadius → radius` を `half` の距離でイージング)
 *   - `lowerShifted`(`translatePointsY`、`lowerProfile` を `-half` ぶんY方向へシフト)
 *   - `lowerSliced`(`slicePoints`、`dropEnd=1` で `upperProfile` の始点と重複する接続点を間引く)
 *   - `upperProfile`(`radius → bulgeRadius` を `half` の距離でイージング)
 *   - `combined`(`concatPoints`)→ `gen`(`latheGenerator`)
 * (`oneIn` は `constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」) */
defineGroupNode({
  type: 'bulgedBand',
  label: 'Bulged Band',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'thickness', label: 'Thickness', type: 'number', default: 0 },
          { id: 'bulge', label: 'Bulge', type: 'number', default: 1 },
          { id: 'segments', label: 'Segments', type: 'number', default: 24 },
        ],
      },
    },
    constNumberInput('oneIn', 1, 'One'),
    { id: 'bulgeRadiusCalc', type: 'numberMultiply', data: { label: 'Bulge Radius' } },
    { id: 'halfCalc', type: 'numberHalf', data: { label: 'Thickness × Half' } },
    { id: 'negatedHalf', type: 'numberNegate', data: { label: 'Negated Half' } },
    { id: 'lowerProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'lowerShifted', type: 'translatePointsY', data: {} },
    { id: 'lowerSliced', type: 'slicePoints', data: {} },
    { id: 'upperProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'combined', type: 'concatPoints', data: {} },
    { id: 'gen', type: 'latheGenerator', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'bulgeRadiusCalc', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bulge', target: 'bulgeRadiusCalc', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'thickness', target: 'halfCalc', targetHandle: 'value' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'negatedHalf', targetHandle: 'value' },

    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'startRadius' },
    { source: 'input', sourceHandle: 'radius', target: 'lowerProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'distance' },
    { source: 'lowerProfile', sourceHandle: 'points', target: 'lowerShifted', targetHandle: 'points' },
    { source: 'negatedHalf', sourceHandle: 'value', target: 'lowerShifted', targetHandle: 'y' },
    { source: 'lowerShifted', sourceHandle: 'points', target: 'lowerSliced', targetHandle: 'points' },
    { source: 'oneIn', sourceHandle: 'value', target: 'lowerSliced', targetHandle: 'dropEnd' },

    { source: 'input', sourceHandle: 'radius', target: 'upperProfile', targetHandle: 'startRadius' },
    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'distance' },

    { source: 'lowerSliced', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsA' },
    { source: 'upperProfile', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsB' },
    { source: 'combined', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
