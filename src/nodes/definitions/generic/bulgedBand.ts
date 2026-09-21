import { defineGroupNode } from '../groupNodeFactory';

/** アンカー(上端、radius)から下端(radius)まで、中間で bulge 倍に膨らむ帯状の回転体を作る
 * グループノード。上半分・下半分それぞれの `easedLatheCurve` の結果を連結して Lathe 化する。
 * `beltGroupNode.ts`(Bulge 可変)と `scarfGroupNode.ts`(首元の輪、Bulge 固定)が共有する。
 *   - `bulgeRadiusCalc`(`numberMultiply`、`radius × bulge`)
 *   - `halfCalc`(`numberHalf`、`thickness × 0.5`)
 *   - `lowerProfile`(`bulgeRadius → radius` を `half` の距離でイージング)
 *   - `lowerShifted`(`translateCurveY`、`lowerProfile` を `-half` ぶんY方向へシフト)
 *   - `upperProfile`(`radius → bulgeRadius` を `half` の距離でイージング)
 *   - `combined`(`concatCurve`、前半が `lowerShifted`、後半が `upperProfile`)→ `gen`(`latheGenerator`)
 * (`gen` の `steps`(12)は上下それぞれ6分割ぶん、入力欄の値) */
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
    { id: 'bulgeRadiusCalc', type: 'numberMultiply', data: {} },
    { id: 'halfCalc', type: 'numberHalf', data: {} },
    { id: 'negatedHalf', type: 'numberNegate', data: {} },
    { id: 'lowerProfile', type: 'easedLatheCurve', data: {} },
    { id: 'lowerShifted', type: 'translateCurveY', data: {} },
    { id: 'upperProfile', type: 'easedLatheCurve', data: {} },
    { id: 'combined', type: 'concatCurve', data: {} },
    { id: 'gen', type: 'latheGenerator', data: { steps: 12 } },
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
    { source: 'lowerProfile', sourceHandle: 'down', target: 'lowerShifted', targetHandle: 'curve' },
    { source: 'negatedHalf', sourceHandle: 'value', target: 'lowerShifted', targetHandle: 'y' },

    { source: 'input', sourceHandle: 'radius', target: 'upperProfile', targetHandle: 'startRadius' },
    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'distance' },

    { source: 'lowerShifted', sourceHandle: 'curve', target: 'combined', targetHandle: 'curveA' },
    { source: 'upperProfile', sourceHandle: 'down', target: 'combined', targetHandle: 'curveB' },
    { source: 'combined', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
