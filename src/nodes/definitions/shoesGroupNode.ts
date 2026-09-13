import { defineGroupNode } from './groupNodeFactory';

/** shoesSoleScale(numberMultiply)+shoesGen(shoesGenerator)+shoesMaterial(toonMaterial)+
 * anchorIn(enumInput)+offsetYIn(numberInput)+placement(garmentPlacement)+outputIO(groupOutput) の7ノードを1枚に
 * まとめたグループノード。Sole Radius/Cuff Radius/Height/Toe Length/Color は他のガーメントと共有
 * されない単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の
 * 同型ノードとして保持する。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build と合わせて外部ソケットのまま受け取る。 */
defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
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
    { id: 'anchorIn', type: 'enumInput', data: { value: 'feet', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'geometry', label: 'Geometry', type: 'geometry' },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'soleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'soleRadius' },
    { source: 'cuffRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'cuffRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'toeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'toeLength' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchorIn', sourceHandle: 'value', target: 'placement', targetHandle: 'anchor' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
  ],
});
