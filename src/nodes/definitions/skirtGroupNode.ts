import { defineGroupNode } from './groupNodeFactory';

/** skirtWaistScale(numberMultiply)+skirtGen(skirtGenerator)+skirtMaterial(toonMaterial)+
 * skirtOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * 生パラメータ(Waist Radius/Length/Flare/Segments)と Color は引き続き外側の
 * numberInput/colorInput ノードとして残り、既存のスライダー/カラーピッカーUIで編集する。 */
defineGroupNode({
  type: 'skirtGroup',
  label: 'Skirt',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'waistRadius', label: 'Waist Radius', type: 'number', default: 0.3 },
          { id: 'length', label: 'Length', type: 'number', default: 0.55 },
          { id: 'flare', label: 'Flare', type: 'number', default: 0.7 },
          { id: 'segments', label: 'Segments', type: 'number', default: 28 },
          { id: 'color', label: 'Color', type: 'color', default: '#d9738c' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'skirtGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0.03, fallbackColor: '#d9738c' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'waistRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'flare', target: 'gen', targetHandle: 'flare' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
