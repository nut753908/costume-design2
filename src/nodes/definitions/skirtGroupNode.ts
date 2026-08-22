import { defineGroupNode } from './groupNodeFactory';

/** skirtWaistScale(numberMultiply)+skirtGen(skirtGenerator)+skirtMaterial(toonMaterial)+
 * skirtOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * 生パラメータ(Waist Radius/Length/Flare/Segments)と Color は引き続き外側の
 * numberInput/colorInput ノードとして残り、既存のスライダー/カラーピッカーUIで編集する。 */
defineGroupNode({
  type: 'skirtGroup',
  label: 'Skirt',
  inputs: [
    { id: 'waistRadius', label: 'Waist Radius', type: 'number', internalNodeId: 'waistRadiusIn', internalDataKey: 'value' },
    { id: 'length', label: 'Length', type: 'number', internalNodeId: 'lengthIn', internalDataKey: 'value' },
    { id: 'flare', label: 'Flare', type: 'number', internalNodeId: 'flareIn', internalDataKey: 'value' },
    { id: 'segments', label: 'Segments', type: 'number', internalNodeId: 'segmentsIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.3 } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.55 } },
    { id: 'flareIn', type: 'numberInput', data: { value: 0.7 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 28 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d9738c' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'skirtGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0.03, fallbackColor: '#d9738c' } },
  ],
  internalEdges: [
    { source: 'waistRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'flareIn', sourceHandle: 'value', target: 'gen', targetHandle: 'flare' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
