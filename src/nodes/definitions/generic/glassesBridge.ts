import { defineGroupNode } from '../groupNodeFactory';

/** 左右のレンズをつなぐブリッジを作るグループノード。`glassesGroupNode.ts` が使う。
 * 1本の箱を `alignedBoxGenerator` で、`bridgeXOffset = lensSpacing - lensRadius` の ± を両端の X
 * (`endX` は `numberNegate` で符号反転)に置いて作る。Y=0・Z=`forwardDepth` は両端で共通。
 * 太さは `bridgeThicknessIn`。 */
defineGroupNode({
  type: 'glassesBridge',
  label: 'Glasses Bridge',
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
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01 } },
    { id: 'bridgeXOffset', type: 'numberSubtract', data: {} },
    { id: 'negatedBridgeXOffset', type: 'numberNegate', data: {} },
    { id: 'bridgeGen', type: 'alignedBoxGenerator', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'lensSpacing', target: 'bridgeXOffset', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'lensRadius', target: 'bridgeXOffset', targetHandle: 'b' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'negatedBridgeXOffset', targetHandle: 'value' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'width' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'thickness' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startX' },
    { source: 'input', sourceHandle: 'forwardDepth', target: 'bridgeGen', targetHandle: 'startZ' },
    { source: 'negatedBridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endX' },
    { source: 'input', sourceHandle: 'forwardDepth', target: 'bridgeGen', targetHandle: 'endZ' },
    { source: 'bridgeGen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
