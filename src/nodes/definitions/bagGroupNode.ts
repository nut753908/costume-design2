import { defineGroupNode } from './groupNodeFactory';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * bagGen(bagGenerator)+bagMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) の5ノードを1枚にまとめる。全パラメータが他のガーメントと共有されない
 * 単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノード
 * として保持する。Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * shoulderY)だけが唯一の外部ソケット。 */
defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 }],
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
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
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
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
