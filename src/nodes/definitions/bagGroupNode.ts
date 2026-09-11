import { defineGroupNode } from './groupNodeFactory';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * bagGen(bagGenerator)+bagMaterial(toonMaterial)+bagOutput(garmentOutput) の3ノードを
 * 1枚にまとめる。 */
defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'strapWidth', label: 'Strap Width', type: 'number', default: 0.04 },
          { id: 'strapThickness', label: 'Strap Thickness', type: 'number', default: 0.015 },
          { id: 'shoulderOffset', label: 'Shoulder Offset', type: 'number', default: 0.08 },
          { id: 'hipOffset', label: 'Hip Offset', type: 'number', default: 0.26 },
          { id: 'drop', label: 'Drop', type: 'number', default: 0.55 },
          { id: 'bagWidth', label: 'Bag Width', type: 'number', default: 0.16 },
          { id: 'bagHeight', label: 'Bag Height', type: 'number', default: 0.14 },
          { id: 'bagDepth', label: 'Bag Depth', type: 'number', default: 0.08 },
          { id: 'color', label: 'Color', type: 'color', default: '#8a4a2e' },
        ],
      },
    },
    { id: 'gen', type: 'bagGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#8a4a2e' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'strapWidth', target: 'gen', targetHandle: 'strapWidth' },
    { source: 'input', sourceHandle: 'strapThickness', target: 'gen', targetHandle: 'strapThickness' },
    { source: 'input', sourceHandle: 'shoulderOffset', target: 'gen', targetHandle: 'shoulderOffset' },
    { source: 'input', sourceHandle: 'hipOffset', target: 'gen', targetHandle: 'hipOffset' },
    { source: 'input', sourceHandle: 'drop', target: 'gen', targetHandle: 'drop' },
    { source: 'input', sourceHandle: 'bagWidth', target: 'gen', targetHandle: 'bagWidth' },
    { source: 'input', sourceHandle: 'bagHeight', target: 'gen', targetHandle: 'bagHeight' },
    { source: 'input', sourceHandle: 'bagDepth', target: 'gen', targetHandle: 'bagDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
