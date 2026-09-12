import { defineGroupNode } from './groupNodeFactory';

/** skirtWaistScale(numberMultiply)+skirtGen(skirtGenerator)+skirtMaterial(toonMaterial)+
 * skirtOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。Waist Radius/Length/
 * Flare/Segments/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する(スライダー/
 * カラーピッカーUIそのものは変わらない)。Body Build のみ全ガーメント共有のため外部ソケットの
 * まま。 */
defineGroupNode({
  type: 'skirtGroup',
  label: 'Skirt',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
      },
    },
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01, label: 'Waist Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 1, step: 0.01, label: 'Length' } },
    { id: 'flareIn', type: 'numberInput', data: { value: 0.7, min: 0, max: 2.5, step: 0.05, label: 'Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 28, min: 8, max: 48, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d9738c', label: 'Skirt Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'skirtGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0.03, fallbackColor: '#d9738c' } },
  ],
  internalEdges: [
    { source: 'waistRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'flareIn', sourceHandle: 'value', target: 'gen', targetHandle: 'flare' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
