import { defineGroupNode } from './groupNodeFactory';

/** dressTorsoScale(numberMultiply)+dressGen(dressGenerator)+dressMaterial(toonMaterial)+
 * dressOutput(garmentOutput)+outputIO(groupOutput) の5ノードを1枚にまとめたグループノード。
 * Torso Radius/Hem Radius/Length/Neckline/Neckline Depth/Color は他のガーメントと共有され
 * ない単独パラメータのため、外側の numberInput/colorInput/enumInput ノードではなくグループ
 * 内部の同型ノードとして保持する。Body Build のみガーメント間で共有されるため外部ソケットの
 * まま。 */
defineGroupNode({
  type: 'dressGroup',
  label: 'Dress',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
      },
    },
    { id: 'torsoRadiusIn', type: 'numberInput', data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.55, min: 0.3, max: 1, step: 0.01, label: 'Hem Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.9, min: 0.4, max: 1.3, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3d7a72', label: 'Dress Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'dressGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#3d7a72' } },
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
    { source: 'torsoRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'hemRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hemRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'output', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'output', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'output', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
