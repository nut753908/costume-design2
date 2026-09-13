import { defineGroupNode } from './groupNodeFactory';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * glassesGen(glassesGenerator)+glassesMaterial(toonMaterial)+anchorIn(enumInput)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+outputIO(groupOutput)+sceneOut(sceneOutput) の7ノードを1枚にまとめる。全パラメータが他の
 * ガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードでは
 * なくグループ内部の同型ノードとして保持する — 共有される外部入力ソケットが1つも無いため、
 * `groupInput` ノード自体を省略している(`defineGroupNode()` は groupInput は省略可、
 * groupOutput は必須)。 */
defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
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
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045, min: 0.02, max: 0.07, step: 0.005, label: 'Lens Radius' } },
    { id: 'frameThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Frame Thickness' } },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055, min: 0.03, max: 0.09, step: 0.005, label: 'Lens Spacing' } },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01, min: 0.005, max: 0.02, step: 0.001, label: 'Bridge Thickness' } },
    { id: 'templeLengthIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.2, step: 0.01, label: 'Temple Length' } },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006, min: 0.003, max: 0.015, step: 0.001, label: 'Temple Thickness' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#2a2a2a', label: 'Glasses Color' } },
    { id: 'gen', type: 'glassesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchorIn', type: 'enumInput', data: { value: 'head', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
    { id: 'offsetYIn', type: 'numberInput', data: { value: -0.02, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: { sockets: [] },
    },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensRadius' },
    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'frameThickness' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensSpacing' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bridgeThickness' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeLength' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeThickness' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'anchorIn', sourceHandle: 'value', target: 'placement', targetHandle: 'anchor' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
