import { defineGroupNode } from './groupNodeFactory';

/** shoesSoleScale(numberMultiply)+shoesGen(shoesGenerator)+shoesMaterial(toonMaterial)+
 * shoesOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として
 * 受け取る。 */
defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes',
  inputs: [
    { id: 'soleRadius', label: 'Sole Radius', type: 'number', internalNodeId: 'soleIn', internalDataKey: 'value' },
    { id: 'cuffRadius', label: 'Cuff Radius', type: 'number', internalNodeId: 'cuffIn', internalDataKey: 'value' },
    { id: 'height', label: 'Height', type: 'number', internalNodeId: 'heightIn', internalDataKey: 'value' },
    { id: 'toeLength', label: 'Toe Length', type: 'number', internalNodeId: 'toeLengthIn', internalDataKey: 'value' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number', internalNodeId: 'legSpacingIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'soleIn', type: 'numberInput', data: { value: 0.13 } },
    { id: 'cuffIn', type: 'numberInput', data: { value: 0.1 } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.12 } },
    { id: 'toeLengthIn', type: 'numberInput', data: { value: 1.5 } },
    { id: 'legSpacingIn', type: 'numberInput', data: { value: 0.14 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3d3630' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'shoesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#3d3630' } },
  ],
  internalEdges: [
    { source: 'soleIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'soleRadius' },
    { source: 'cuffIn', sourceHandle: 'value', target: 'gen', targetHandle: 'cuffRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'toeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'toeLength' },
    { source: 'legSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
