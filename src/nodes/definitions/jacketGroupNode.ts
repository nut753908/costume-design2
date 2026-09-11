import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'jacketGroup',
  label: 'Jacket',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'shoulderRadius', label: 'Shoulder Radius', type: 'number', default: 0.34 },
          { id: 'length', label: 'Length', type: 'number', default: 0.42 },
          { id: 'hemFlare', label: 'Hem Flare', type: 'number', default: 0.15 },
          { id: 'segments', label: 'Segments', type: 'number', default: 20 },
          { id: 'color', label: 'Color', type: 'color', default: '#4a5c3e' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'jacketGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#4a5c3e' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'shoulderRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'shoulderRadius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'hemFlare', target: 'gen', targetHandle: 'hemFlare' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
