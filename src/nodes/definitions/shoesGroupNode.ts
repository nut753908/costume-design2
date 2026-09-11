import { defineGroupNode } from './groupNodeFactory';

/** shoesSoleScale(numberMultiply)+shoesGen(shoesGenerator)+shoesMaterial(toonMaterial)+
 * shoesOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として
 * 受け取る。 */
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
          { id: 'soleRadius', label: 'Sole Radius', type: 'number', default: 0.13 },
          { id: 'cuffRadius', label: 'Cuff Radius', type: 'number', default: 0.1 },
          { id: 'height', label: 'Height', type: 'number', default: 0.12 },
          { id: 'toeLength', label: 'Toe Length', type: 'number', default: 1.5 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'color', label: 'Color', type: 'color', default: '#3d3630' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'shoesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#3d3630' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'soleRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'soleRadius' },
    { source: 'input', sourceHandle: 'cuffRadius', target: 'gen', targetHandle: 'cuffRadius' },
    { source: 'input', sourceHandle: 'height', target: 'gen', targetHandle: 'height' },
    { source: 'input', sourceHandle: 'toeLength', target: 'gen', targetHandle: 'toeLength' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
