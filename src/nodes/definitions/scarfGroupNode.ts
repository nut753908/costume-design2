import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'scarfGroup',
  label: 'Scarf',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'neckRadius', label: 'Neck Radius', type: 'number', default: 0.19 },
          { id: 'bandThickness', label: 'Band Thickness', type: 'number', default: 0.05 },
          { id: 'tailWidth', label: 'Tail Width', type: 'number', default: 0.09 },
          { id: 'tailLength', label: 'Tail Length', type: 'number', default: 0.35 },
          { id: 'segments', label: 'Segments', type: 'number', default: 20 },
          { id: 'color', label: 'Color', type: 'color', default: '#8a2e3a' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'scarfGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0.08, fallbackColor: '#8a2e3a' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'neckRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'neckRadius' },
    { source: 'input', sourceHandle: 'bandThickness', target: 'gen', targetHandle: 'bandThickness' },
    { source: 'input', sourceHandle: 'tailWidth', target: 'gen', targetHandle: 'tailWidth' },
    { source: 'input', sourceHandle: 'tailLength', target: 'gen', targetHandle: 'tailLength' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
