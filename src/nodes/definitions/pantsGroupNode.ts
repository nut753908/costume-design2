import { defineGroupNode } from './groupNodeFactory';

/** pantsWaistScale(numberMultiply)+pantsGen(pantsGenerator)+pantsMaterial(toonMaterial)+
 * pantsOutput(garmentOutput)+outputIO(groupOutput) の5ノードを1枚にまとめたグループノード。
 * Waist Radius/Hem Radius/Inseam/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。
 *
 * Leg Spacing(`pantsLegSpacing`)は shoesGroup/socksGroup からも直接再引きされる外部の
 * numberInput ノードのまま残す(pantsGroup 内部には取り込まない)ため、Body Build と合わせて
 * 外部ソケットのまま。 */
defineGroupNode({
  type: 'pantsGroup',
  label: 'Pants',
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
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Waist Radius' } },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.1, min: 0.05, max: 0.2, step: 0.005, label: 'Hem Radius' } },
    { id: 'inseamIn', type: 'numberInput', data: { value: 0.75, min: 0.3, max: 1, step: 0.01, label: 'Inseam' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#9c7b4f', label: 'Pants Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'pantsGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#9c7b4f' } },
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'material', label: 'Material', type: 'material' },
          { id: 'anchor', label: 'Anchor', type: 'enum' },
          { id: 'offsetY', label: 'Offset Y', type: 'number' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'waistRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'waistRadius' },
    { source: 'hemRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hemRadius' },
    { source: 'inseamIn', sourceHandle: 'value', target: 'gen', targetHandle: 'inseam' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'output', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'output', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
