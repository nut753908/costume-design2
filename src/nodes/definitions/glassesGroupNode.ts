import { defineGroupNode } from './groupNodeFactory';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * glassesGen(glassesGenerator)+glassesMaterial(toonMaterial)+glassesOutput(garmentOutput)
 * の3ノードを1枚にまとめる。 */
defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  inputs: [
    { id: 'lensRadius', label: 'Lens Radius', type: 'number', internalNodeId: 'lensRadiusIn', internalDataKey: 'value' },
    {
      id: 'frameThickness',
      label: 'Frame Thickness',
      type: 'number',
      internalNodeId: 'frameThicknessIn',
      internalDataKey: 'value',
    },
    {
      id: 'lensSpacing',
      label: 'Lens Spacing',
      type: 'number',
      internalNodeId: 'lensSpacingIn',
      internalDataKey: 'value',
    },
    {
      id: 'bridgeThickness',
      label: 'Bridge Thickness',
      type: 'number',
      internalNodeId: 'bridgeThicknessIn',
      internalDataKey: 'value',
    },
    {
      id: 'templeLength',
      label: 'Temple Length',
      type: 'number',
      internalNodeId: 'templeLengthIn',
      internalDataKey: 'value',
    },
    {
      id: 'templeThickness',
      label: 'Temple Thickness',
      type: 'number',
      internalNodeId: 'templeThicknessIn',
      internalDataKey: 'value',
    },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045 } },
    { id: 'frameThicknessIn', type: 'numberInput', data: { value: 0.008 } },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055 } },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01 } },
    { id: 'templeLengthIn', type: 'numberInput', data: { value: 0.12 } },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#2a2a2a' } },
    { id: 'gen', type: 'glassesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: -0.02, fallbackColor: '#2a2a2a' } },
  ],
  internalEdges: [
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensRadius' },
    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'frameThickness' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensSpacing' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bridgeThickness' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeLength' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeThickness' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
