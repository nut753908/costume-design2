import { defineGroupNode } from './groupNodeFactory';

/** beltRadiusScale(numberMultiply)+beltGen(beltGenerator)+beltMaterial(toonMaterial)+
 * anchor(garmentAnchor)+placement(garmentPlacement)+outputIO(groupOutput) の6ノードを1枚に
 * まとめたグループノード。Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build のみガーメント間で共有されるため外部ソケットのまま。 */
defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
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
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.32, min: 0.2, max: 0.45, step: 0.01, label: 'Radius' } },
    { id: 'thicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.12, step: 0.005, label: 'Thickness' } },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.15, min: 1, max: 1.5, step: 0.01, label: 'Bulge' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24, min: 8, max: 48, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3a2e26', label: 'Belt Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'beltGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'waist', offsetY: 0 } },
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
    { source: 'radiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'radius' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'thickness' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bulge' },
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
