import { defineGroupNode } from './groupNodeFactory';

/** glovesWristScale(numberMultiply)+glovesGen(glovesGenerator)+glovesMaterial(toonMaterial)+
 * glovesOutput(garmentOutput)+outputIO(groupOutput) の5ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length/Arm Spacing/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build のみガーメント間で共有されるため外部ソケットのまま。 */
defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
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
    { id: 'output', type: 'garmentOutput', data: { anchor: 'wrist', offsetY: 0, fallbackColor: '#b0413e' } },
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
    { source: 'wristRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'wristRadius' },
    { source: 'handRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'handRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'armSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'armSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'output', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'output', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
