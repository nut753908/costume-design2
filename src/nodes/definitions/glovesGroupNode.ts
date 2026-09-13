import { defineGroupNode } from './groupNodeFactory';

/** glovesWristScale(numberMultiply)+glovesGen(glovesGenerator)+glovesMaterial(toonMaterial)+
 * anchorIn(enumInput)+offsetYIn(numberInput)+placement(garmentPlacement)+outputIO(groupOutput)+sceneOut(sceneOutput) の8ノードを1枚に
 * まとめたグループノード。Wrist Radius/Hand Radius/Length/Arm Spacing/Color は他のガーメントと
 * 共有されない単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ
 * 内部の同型ノードとして保持する。Body Build のみガーメント間で共有されるため外部ソケットの
 * まま。 */
defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
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
    { id: 'wristRadiusIn', type: 'numberInput', data: { value: 0.08, min: 0.05, max: 0.12, step: 0.005, label: 'Wrist Radius' } },
    { id: 'handRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.16, step: 0.005, label: 'Hand Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Length' } },
    { id: 'armSpacingIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Arm Spacing' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#b0413e', label: 'Gloves Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'glovesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchorIn', type: 'enumInput', data: { value: 'wrist', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    {
      id: 'outputIO',
      type: 'groupOutput',
      data: { sockets: [] },
    },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'wristRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'wristRadius' },
    { source: 'handRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'handRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'armSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'armSpacing' },
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
