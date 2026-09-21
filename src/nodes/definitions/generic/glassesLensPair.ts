import { defineGroupNode } from '../groupNodeFactory';

/** 左右のレンズを作るグループノード。`glassesGroupNode.ts` が使う。トーラス1個(X=0 基準)を
 * `translateZ` で顔の前面(`forwardDepth`)へ置き、`mirrorPair` で ±`lensSpacing` へ複製する。
 * トーラスの管の太さ(`tube`)は `frameThicknessHalf`(`numberHalf`、`Value` 入力欄の値がフレームの
 * 太さ)として渡す。 */
defineGroupNode({
  type: 'glassesLensPair',
  label: 'Glasses Lens Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'lensRadius', label: 'Lens Radius', type: 'number', default: 0.045 },
          { id: 'lensSpacing', label: 'Lens Spacing', type: 'number', default: 0.055 },
          { id: 'forwardDepth', label: 'Forward Depth', type: 'number', default: 0.14 },
        ],
      },
    },
    { id: 'frameThicknessHalf', type: 'numberHalf', data: { value: 0.008 } },
    { id: 'lensGen', type: 'torusGenerator', data: {} },
    { id: 'lensTranslateZ', type: 'translateZ', data: {} },
    { id: 'lensMirror', type: 'mirrorPair', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'lensRadius', target: 'lensGen', targetHandle: 'radius' },
    { source: 'frameThicknessHalf', sourceHandle: 'value', target: 'lensGen', targetHandle: 'tube' },
    { source: 'lensGen', sourceHandle: 'geometry', target: 'lensTranslateZ', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'forwardDepth', target: 'lensTranslateZ', targetHandle: 'z' },
    { source: 'lensTranslateZ', sourceHandle: 'geometry', target: 'lensMirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'lensSpacing', target: 'lensMirror', targetHandle: 'offset' },
    { source: 'lensMirror', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
