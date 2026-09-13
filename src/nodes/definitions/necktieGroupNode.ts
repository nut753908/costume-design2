import { defineGroupNode } from './groupNodeFactory';

/** necktie は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * necktieGen(necktieGenerator)+necktieMaterial(toonMaterial)+anchor(garmentAnchor)+
 * placement(garmentPlacement)+outputIO(groupOutput) の5ノードを1枚にまとめる。全パラメータが他の
 * ガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードでは
 * なくグループ内部の同型ノードとして保持する — 共有される外部入力ソケットが1つも無いため、
 * `groupInput` ノード自体を省略している(`defineGroupNode()` は groupInput は省略可、
 * groupOutput は必須)。 */
defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
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
    { id: 'knotWidthIn', type: 'numberInput', data: { value: 0.05, min: 0.03, max: 0.08, step: 0.005, label: 'Knot Width' } },
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.07, step: 0.005, label: 'Knot Height' } },
    { id: 'knotThicknessIn', type: 'numberInput', data: { value: 0.025, min: 0.01, max: 0.05, step: 0.005, label: 'Knot Thickness' } },
    { id: 'bladeTopWidthIn', type: 'numberInput', data: { value: 0.035, min: 0.015, max: 0.06, step: 0.005, label: 'Blade Top Width' } },
    { id: 'bladeBottomWidthIn', type: 'numberInput', data: { value: 0.06, min: 0.03, max: 0.12, step: 0.005, label: 'Blade Bottom Width' } },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Blade Thickness' } },
    { id: 'bladeLengthIn', type: 'numberInput', data: { value: 0.4, min: 0.2, max: 0.7, step: 0.01, label: 'Blade Length' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#7a1f2b', label: 'Necktie Color' } },
    { id: 'gen', type: 'necktieGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'shoulder', offsetY: 0 } },
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
    { source: 'knotWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotWidth' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotHeight' },
    { source: 'knotThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'knotThickness' },
    { source: 'bladeTopWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeTopWidth' },
    { source: 'bladeBottomWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeBottomWidth' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeThickness' },
    { source: 'bladeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bladeLength' },
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
