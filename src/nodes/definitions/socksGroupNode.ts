import { defineGroupNode } from './groupNodeFactory';

/** socksAnkleScale(numberMultiply)+socksGen(socksGenerator)+socksMaterial(toonMaterial)+
 * socksOutput(garmentOutput)+outputIO(groupOutput) の5ノードを1枚にまとめたグループノード。
 * Ankle Radius/Calf Radius/Height/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build と合わせて外部ソケットのまま受け取る。 */
defineGroupNode({
  type: 'socksGroup',
  label: 'Socks',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'ankleRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.15, step: 0.005, label: 'Ankle Radius' } },
    { id: 'calfRadiusIn', type: 'numberInput', data: { value: 0.105, min: 0.05, max: 0.2, step: 0.005, label: 'Calf Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.22, min: 0.08, max: 0.5, step: 0.01, label: 'Height' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d4a83a', label: 'Socks Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'socksGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#d4a83a' } },
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
    { source: 'ankleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'ankleRadius' },
    { source: 'calfRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'calfRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
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
