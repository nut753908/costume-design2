import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  inputs: [
    { id: 'wristRadius', label: 'Wrist Radius', type: 'number', internalNodeId: 'wristIn', internalDataKey: 'value' },
    { id: 'handRadius', label: 'Hand Radius', type: 'number', internalNodeId: 'handIn', internalDataKey: 'value' },
    { id: 'length', label: 'Length', type: 'number', internalNodeId: 'lengthIn', internalDataKey: 'value' },
    { id: 'armSpacing', label: 'Arm Spacing', type: 'number', internalNodeId: 'armSpacingIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'wristIn', type: 'numberInput', data: { value: 0.08 } },
    { id: 'handIn', type: 'numberInput', data: { value: 0.09 } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.14 } },
    { id: 'armSpacingIn', type: 'numberInput', data: { value: 0.34 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#b0413e' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'glovesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'wrist', offsetY: 0, fallbackColor: '#b0413e' } },
  ],
  internalEdges: [
    { source: 'wristIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'wristRadius' },
    { source: 'handIn', sourceHandle: 'value', target: 'gen', targetHandle: 'handRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'armSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'armSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
