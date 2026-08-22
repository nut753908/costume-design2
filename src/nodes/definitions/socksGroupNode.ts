import { defineGroupNode } from './groupNodeFactory';

/** socksAnkleScale(numberMultiply)+socksGen(socksGenerator)+socksMaterial(toonMaterial)+
 * socksOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として
 * 受け取る。 */
defineGroupNode({
  type: 'socksGroup',
  label: 'Socks',
  inputs: [
    { id: 'ankleRadius', label: 'Ankle Radius', type: 'number', internalNodeId: 'ankleRadiusIn', internalDataKey: 'value' },
    { id: 'calfRadius', label: 'Calf Radius', type: 'number', internalNodeId: 'calfRadiusIn', internalDataKey: 'value' },
    { id: 'height', label: 'Height', type: 'number', internalNodeId: 'heightIn', internalDataKey: 'value' },
    { id: 'segments', label: 'Segments', type: 'number', internalNodeId: 'segmentsIn', internalDataKey: 'value' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number', internalNodeId: 'legSpacingIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'ankleRadiusIn', type: 'numberInput', data: { value: 0.09 } },
    { id: 'calfRadiusIn', type: 'numberInput', data: { value: 0.105 } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.22 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16 } },
    { id: 'legSpacingIn', type: 'numberInput', data: { value: 0.14 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d4a83a' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'socksGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#d4a83a' } },
  ],
  internalEdges: [
    { source: 'ankleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'ankleRadius' },
    { source: 'calfRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'calfRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'legSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
