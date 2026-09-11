import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0.32 },
          { id: 'thickness', label: 'Thickness', type: 'number', default: 0.05 },
          { id: 'bulge', label: 'Bulge', type: 'number', default: 1.15 },
          { id: 'segments', label: 'Segments', type: 'number', default: 24 },
          { id: 'color', label: 'Color', type: 'color', default: '#3a2e26' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'beltGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#3a2e26' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'radius' },
    { source: 'input', sourceHandle: 'thickness', target: 'gen', targetHandle: 'thickness' },
    { source: 'input', sourceHandle: 'bulge', target: 'gen', targetHandle: 'bulge' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
