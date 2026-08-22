import { defineGroupNode } from './groupNodeFactory';

/** necktie は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * necktieGen(necktieGenerator)+necktieMaterial(toonMaterial)+necktieOutput(garmentOutput)
 * の3ノードを1枚にまとめる。 */
defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
  inputs: [
    { id: 'knotWidth', label: 'Knot Width', type: 'number', internalNodeId: 'knotWidthIn', internalDataKey: 'value' },
    { id: 'knotHeight', label: 'Knot Height', type: 'number', internalNodeId: 'knotHeightIn', internalDataKey: 'value' },
    {
      id: 'knotThickness',
      label: 'Knot Thickness',
      type: 'number',
      internalNodeId: 'knotThicknessIn',
      internalDataKey: 'value',
    },
    {
      id: 'bladeTopWidth',
      label: 'Blade Top Width',
      type: 'number',
      internalNodeId: 'bladeTopWidthIn',
      internalDataKey: 'value',
    },
    {
      id: 'bladeBottomWidth',
      label: 'Blade Bottom Width',
      type: 'number',
      internalNodeId: 'bladeBottomWidthIn',
      internalDataKey: 'value',
    },
    {
      id: 'bladeThickness',
      label: 'Blade Thickness',
      type: 'number',
      internalNodeId: 'bladeThicknessIn',
      internalDataKey: 'value',
    },
    {
      id: 'bladeLength',
      label: 'Blade Length',
      type: 'number',
      internalNodeId: 'bladeLengthIn',
      internalDataKey: 'value',
    },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'knotWidthIn', type: 'numberInput', data: { value: 0.05 } },
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04 } },
    { id: 'knotThicknessIn', type: 'numberInput', data: { value: 0.025 } },
    { id: 'bladeTopWidthIn', type: 'numberInput', data: { value: 0.035 } },
    { id: 'bladeBottomWidthIn', type: 'numberInput', data: { value: 0.06 } },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008 } },
    { id: 'bladeLengthIn', type: 'numberInput', data: { value: 0.4 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#7a1f2b' } },
    { id: 'gen', type: 'necktieGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#7a1f2b' } },
  ],
  internalEdges: [
    { source: 'knotWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotWidth' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotHeight' },
    { source: 'knotThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotThickness' },
    { source: 'bladeTopWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeTopWidth' },
    { source: 'bladeBottomWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeBottomWidth' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeThickness' },
    { source: 'bladeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeLength' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
