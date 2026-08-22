import { defineGroupNode } from './groupNodeFactory';

defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  inputs: [
    { id: 'radius', label: 'Radius', type: 'number', internalNodeId: 'radiusIn', internalDataKey: 'value' },
    { id: 'thickness', label: 'Thickness', type: 'number', internalNodeId: 'thicknessIn', internalDataKey: 'value' },
    { id: 'bulge', label: 'Bulge', type: 'number', internalNodeId: 'bulgeIn', internalDataKey: 'value' },
    { id: 'segments', label: 'Segments', type: 'number', internalNodeId: 'segmentsIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.32 } },
    { id: 'thicknessIn', type: 'numberInput', data: { value: 0.05 } },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.15 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3a2e26' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'beltGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#3a2e26' } },
  ],
  internalEdges: [
    { source: 'radiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'radius' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'thickness' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bulge' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
