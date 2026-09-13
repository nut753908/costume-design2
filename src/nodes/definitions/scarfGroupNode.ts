import { defineGroupNode } from './groupNodeFactory';

/** scarfNeckScale(numberMultiply)+scarfGen(scarfGenerator)+scarfMaterial(toonMaterial)+
 * anchor(garmentAnchor)+placement(garmentPlacement)+outputIO(groupOutput) の6ノードを1枚に
 * まとめたグループノード。Neck Radius/Band Thickness/Tail Width/Tail Length/Segments/Color は
 * 他のガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードで
 * はなくグループ内部の同型ノードとして保持する。Body Build のみガーメント間で共有されるため
 * 外部ソケットのまま。 */
defineGroupNode({
  type: 'scarfGroup',
  label: 'Scarf',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'neckRadiusIn', type: 'numberInput', data: { value: 0.19, min: 0.14, max: 0.3, step: 0.005, label: 'Neck Radius' } },
    { id: 'bandThicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.1, step: 0.005, label: 'Band Thickness' } },
    { id: 'tailWidthIn', type: 'numberInput', data: { value: 0.09, min: 0.04, max: 0.16, step: 0.005, label: 'Tail Width' } },
    { id: 'tailLengthIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.7, step: 0.01, label: 'Tail Length' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a2e3a', label: 'Scarf Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'scarfGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'shoulder', offsetY: 0.08 } },
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
    { source: 'neckRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'neckRadius' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bandThickness' },
    { source: 'tailWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'tailWidth' },
    { source: 'tailLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'tailLength' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchor', sourceHandle: 'anchor', target: 'placement', targetHandle: 'anchor' },
    { source: 'anchor', sourceHandle: 'offsetY', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
  ],
});
