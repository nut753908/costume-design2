import { defineGroupNode } from './groupNodeFactory';

/** pantsWaistScale(numberMultiply)+pantsGen(pantsGenerator)+pantsMaterial(toonMaterial)+
 * pantsOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 *
 * Leg Spacing(`pantsLegSpacing`)は shoesGroup/socksGroup からも直接再引きされる外部の
 * numberInput ノードのまま残す(pantsGroup 内部には取り込まない)ため、追加の出力公開は不要。 */
defineGroupNode({
  type: 'pantsGroup',
  label: 'Pants',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'waistRadius', label: 'Waist Radius', type: 'number', default: 0.16 },
          { id: 'hemRadius', label: 'Hem Radius', type: 'number', default: 0.1 },
          { id: 'inseam', label: 'Inseam', type: 'number', default: 0.75 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'segments', label: 'Segments', type: 'number', default: 16 },
          { id: 'color', label: 'Color', type: 'color', default: '#9c7b4f' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'pantsGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#9c7b4f' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'waistRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'input', sourceHandle: 'hemRadius', target: 'gen', targetHandle: 'hemRadius' },
    { source: 'input', sourceHandle: 'inseam', target: 'gen', targetHandle: 'inseam' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
