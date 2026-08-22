import { defineGroupNode } from './groupNodeFactory';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * bagGen(bagGenerator)+bagMaterial(toonMaterial)+bagOutput(garmentOutput) の3ノードを
 * 1枚にまとめる。 */
defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  inputs: [
    { id: 'strapWidth', label: 'Strap Width', type: 'number', internalNodeId: 'strapWidthIn', internalDataKey: 'value' },
    {
      id: 'strapThickness',
      label: 'Strap Thickness',
      type: 'number',
      internalNodeId: 'strapThicknessIn',
      internalDataKey: 'value',
    },
    {
      id: 'shoulderOffset',
      label: 'Shoulder Offset',
      type: 'number',
      internalNodeId: 'shoulderOffsetIn',
      internalDataKey: 'value',
    },
    { id: 'hipOffset', label: 'Hip Offset', type: 'number', internalNodeId: 'hipOffsetIn', internalDataKey: 'value' },
    { id: 'drop', label: 'Drop', type: 'number', internalNodeId: 'dropIn', internalDataKey: 'value' },
    { id: 'bagWidth', label: 'Bag Width', type: 'number', internalNodeId: 'bagWidthIn', internalDataKey: 'value' },
    { id: 'bagHeight', label: 'Bag Height', type: 'number', internalNodeId: 'bagHeightIn', internalDataKey: 'value' },
    { id: 'bagDepth', label: 'Bag Depth', type: 'number', internalNodeId: 'bagDepthIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'strapWidthIn', type: 'numberInput', data: { value: 0.04 } },
    { id: 'strapThicknessIn', type: 'numberInput', data: { value: 0.015 } },
    { id: 'shoulderOffsetIn', type: 'numberInput', data: { value: 0.08 } },
    { id: 'hipOffsetIn', type: 'numberInput', data: { value: 0.26 } },
    { id: 'dropIn', type: 'numberInput', data: { value: 0.55 } },
    { id: 'bagWidthIn', type: 'numberInput', data: { value: 0.16 } },
    { id: 'bagHeightIn', type: 'numberInput', data: { value: 0.14 } },
    { id: 'bagDepthIn', type: 'numberInput', data: { value: 0.08 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a4a2e' } },
    { id: 'gen', type: 'bagGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#8a4a2e' } },
  ],
  internalEdges: [
    { source: 'strapWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'strapWidth' },
    { source: 'strapThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'strapThickness' },
    { source: 'shoulderOffsetIn', sourceHandle: 'value', target: 'gen', targetHandle: 'shoulderOffset' },
    { source: 'hipOffsetIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hipOffset' },
    { source: 'dropIn', sourceHandle: 'value', target: 'gen', targetHandle: 'drop' },
    { source: 'bagWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagWidth' },
    { source: 'bagHeightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagHeight' },
    { source: 'bagDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
