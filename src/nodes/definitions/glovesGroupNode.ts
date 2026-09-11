import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'wristRadius', label: 'Wrist Radius', type: 'number', default: 0.08 },
          { id: 'handRadius', label: 'Hand Radius', type: 'number', default: 0.09 },
          { id: 'length', label: 'Length', type: 'number', default: 0.14 },
          { id: 'armSpacing', label: 'Arm Spacing', type: 'number', default: 0.34 },
          { id: 'color', label: 'Color', type: 'color', default: '#b0413e' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'glovesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'wrist', offsetY: 0, fallbackColor: '#b0413e' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'wristRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'wristRadius' },
    { source: 'input', sourceHandle: 'handRadius', target: 'gen', targetHandle: 'handRadius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'armSpacing', target: 'gen', targetHandle: 'armSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
