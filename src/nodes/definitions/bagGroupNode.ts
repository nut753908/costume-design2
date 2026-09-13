import { defineGroupNode } from './groupNodeFactory';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * bagGen(bagGenerator)+bagMaterial(toonMaterial)+anchorIn(enumInput)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+outputIO(groupOutput) の6ノードを1枚にまとめる。全パラメータが他のガーメントと共有されない
 * 単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノード
 * として保持する — 共有される外部入力ソケットが1つも無いため、`groupInput` ノード自体を
 * 省略している(`defineGroupNode()` は groupInput は省略可、groupOutput は必須)。 */
defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
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
    { id: 'strapWidthIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.08, step: 0.005, label: 'Strap Width' } },
    { id: 'strapThicknessIn', type: 'numberInput', data: { value: 0.015, min: 0.005, max: 0.03, step: 0.005, label: 'Strap Thickness' } },
    { id: 'shoulderOffsetIn', type: 'numberInput', data: { value: 0.08, min: 0, max: 0.2, step: 0.01, label: 'Shoulder Offset' } },
    { id: 'hipOffsetIn', type: 'numberInput', data: { value: 0.26, min: 0, max: 0.4, step: 0.01, label: 'Hip Offset' } },
    { id: 'dropIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 0.9, step: 0.01, label: 'Drop' } },
    { id: 'bagWidthIn', type: 'numberInput', data: { value: 0.16, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Width' } },
    { id: 'bagHeightIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Height' } },
    { id: 'bagDepthIn', type: 'numberInput', data: { value: 0.08, min: 0.02, max: 0.2, step: 0.01, label: 'Bag Depth' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a4a2e', label: 'Bag Color' } },
    { id: 'gen', type: 'bagGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchorIn', type: 'enumInput', data: { value: 'shoulder', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
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
    { source: 'strapWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'strapWidth' },
    { source: 'strapThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'strapThickness' },
    { source: 'shoulderOffsetIn', sourceHandle: 'value', target: 'gen', targetHandle: 'shoulderOffset' },
    { source: 'hipOffsetIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hipOffset' },
    { source: 'dropIn', sourceHandle: 'value', target: 'gen', targetHandle: 'drop' },
    { source: 'bagWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagWidth' },
    { source: 'bagHeightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagHeight' },
    { source: 'bagDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bagDepth' },
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
