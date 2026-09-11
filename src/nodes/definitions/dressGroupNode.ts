import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'dressGroup',
  label: 'Dress',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.29 },
          { id: 'hemRadius', label: 'Hem Radius', type: 'number', default: 0.55 },
          { id: 'length', label: 'Length', type: 'number', default: 0.9 },
          { id: 'neckline', label: 'Neckline', type: 'enum', default: 'round', options: ['round', 'v', 'square'] },
          { id: 'necklineDepth', label: 'Neckline Depth', type: 'number', default: 0.12 },
          { id: 'color', label: 'Color', type: 'color', default: '#3d7a72' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'dressGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#3d7a72' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'input', sourceHandle: 'hemRadius', target: 'gen', targetHandle: 'hemRadius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'neckline', target: 'gen', targetHandle: 'necklineType' },
    { source: 'input', sourceHandle: 'necklineDepth', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
