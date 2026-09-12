import { defineGroupNode } from './groupNodeFactory';

/** shoesSoleScale(numberMultiply)+shoesGen(shoesGenerator)+shoesMaterial(toonMaterial)+
 * shoesOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。Sole Radius/Cuff
 * Radius/Height/Toe Length/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build と合わせて外部ソケットのまま受け取る。 */
defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'soleRadiusIn', type: 'numberInput', data: { value: 0.13, min: 0.1, max: 0.2, step: 0.005, label: 'Sole Radius' } },
    { id: 'cuffRadiusIn', type: 'numberInput', data: { value: 0.1, min: 0.08, max: 0.16, step: 0.005, label: 'Cuff Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.25, step: 0.005, label: 'Height' } },
    { id: 'toeLengthIn', type: 'numberInput', data: { value: 1.5, min: 1, max: 2.5, step: 0.05, label: 'Toe Length' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3d3630', label: 'Shoes Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'shoesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#3d3630' } },
  ],
  internalEdges: [
    { source: 'soleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'soleRadius' },
    { source: 'cuffRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'cuffRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'toeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'toeLength' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
