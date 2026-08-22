import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が computeBodyDimensions で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * hatGen(hatGenerator)+hatMaterial(toonMaterial)+hatOutput(garmentOutput) の3ノードを
 * 1枚にまとめる。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  inputs: [
    { id: 'brimRadius', label: 'Brim Radius', type: 'number', internalNodeId: 'brimRadiusIn', internalDataKey: 'value' },
    { id: 'crownRadius', label: 'Crown Radius', type: 'number', internalNodeId: 'crownRadiusIn', internalDataKey: 'value' },
    { id: 'height', label: 'Height', type: 'number', internalNodeId: 'heightIn', internalDataKey: 'value' },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
  ],
  outputs: [],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'brimRadiusIn', type: 'numberInput', data: { value: 0.2 } },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02 } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a3b6b' } },
    { id: 'gen', type: 'hatGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: 0.1, fallbackColor: '#4a3b6b' } },
  ],
  internalEdges: [
    { source: 'brimRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'brimRadius' },
    { source: 'crownRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'crownRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
