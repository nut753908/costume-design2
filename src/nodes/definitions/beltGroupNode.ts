import { defineGroupNode } from './groupNodeFactory';

/** beltRadiusScale(numberMultiply)+beltGen(beltGenerator)+beltMaterial(toonMaterial)+
 * beltOutput(garmentOutput)+outputIO(groupOutput) の5ノードを1枚にまとめたグループノード。
 * Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build のみガーメント間で共有されるため外部ソケットのまま。 */
defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
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
    { id: 'output', type: 'garmentOutput', data: { anchor: 'waist', offsetY: 0, fallbackColor: '#3a2e26' } },
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
    { source: 'radiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'radius' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'thickness' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bulge' },
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
