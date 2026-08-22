import { defineGroupNode } from './groupNodeFactory';

/** pantsWaistScale(numberMultiply)+pantsGen(pantsGenerator)+pantsMaterial(toonMaterial)+
 * pantsOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 *
 * Leg Spacing(`pantsLegSpacing`)は shoesGroup/socksGroup からも直接再引きされる外部の
 * numberInput ノードのまま残す(pantsGroup 内部には取り込まない)ため、追加の出力公開は不要。 */
defineGroupNode({
  type: 'pantsGroup',
  label: 'Pants',
  inputs: [
    { id: 'waistRadius', label: 'Waist Radius', type: 'number', internalNodeId: 'waistIn', internalDataKey: 'value' },
    { id: 'hemRadius', label: 'Hem Radius', type: 'number', internalNodeId: 'hemIn', internalDataKey: 'value' },
    { id: 'inseam', label: 'Inseam', type: 'number', internalNodeId: 'inseamIn', internalDataKey: 'value' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number', internalNodeId: 'legSpacingIn', internalDataKey: 'value' },
    { id: 'segments', label: 'Segments', type: 'number', internalNodeId: 'segmentsIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'waistIn', type: 'numberInput', data: { value: 0.16 } },
    { id: 'hemIn', type: 'numberInput', data: { value: 0.1 } },
    { id: 'inseamIn', type: 'numberInput', data: { value: 0.75 } },
    { id: 'legSpacingIn', type: 'numberInput', data: { value: 0.14 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#9c7b4f' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'pantsGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#9c7b4f' } },
  ],
  internalEdges: [
    { source: 'waistIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'hemIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hemRadius' },
    { source: 'inseamIn', sourceHandle: 'value', target: 'gen', targetHandle: 'inseam' },
    { source: 'legSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
