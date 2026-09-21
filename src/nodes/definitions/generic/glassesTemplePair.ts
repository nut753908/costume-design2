import { defineGroupNode } from '../groupNodeFactory';

/** 左右のテンプル(耳にかける脚)を作るグループノード。`glassesGroupNode.ts` が使う。
 * 1本(X=0 基準)を `alignedBoxGenerator` で前面(`forwardDepth`)から後方
 * `templeBackZ = (forwardDepth - 0.02) - 0.12` まで Z 方向に伸ばし、`mirrorPair` で
 * ±`templeXOffset = lensSpacing + lensRadius` へ複製する。太さは `templeThicknessIn`。 */
defineGroupNode({
  type: 'glassesTemplePair',
  label: 'Glasses Temple Pair',
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
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006 } },
    { id: 'templeXOffset', type: 'numberAdd', data: {} },
    { id: 'templeBackDepth', type: 'numberSubtract', data: { b: 0.02 } },
    { id: 'templeBackZ', type: 'numberSubtract', data: { b: 0.12 } },
    { id: 'templeGen', type: 'alignedBoxGenerator', data: {} },
    { id: 'templeMirror', type: 'mirrorPair', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'lensSpacing', target: 'templeXOffset', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'lensRadius', target: 'templeXOffset', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'forwardDepth', target: 'templeBackDepth', targetHandle: 'a' },
    { source: 'templeBackDepth', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'a' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'width' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'thickness' },
    { source: 'input', sourceHandle: 'forwardDepth', target: 'templeGen', targetHandle: 'startZ' },
    { source: 'templeBackZ', sourceHandle: 'value', target: 'templeGen', targetHandle: 'endZ' },
    { source: 'templeGen', sourceHandle: 'geometry', target: 'templeMirror', targetHandle: 'geometry' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'templeMirror', targetHandle: 'offset' },
    { source: 'templeMirror', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
