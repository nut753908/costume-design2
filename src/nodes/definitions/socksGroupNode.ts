import { defineGroupNode } from './groupNodeFactory';

/** socksAnkleScale(numberMultiply)+socksGen(socksGenerator)+socksMaterial(toonMaterial)+
 * socksOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として
 * 受け取る。 */
defineGroupNode({
  type: 'socksGroup',
  label: 'Socks',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'ankleRadius', label: 'Ankle Radius', type: 'number', default: 0.09 },
          { id: 'calfRadius', label: 'Calf Radius', type: 'number', default: 0.105 },
          { id: 'height', label: 'Height', type: 'number', default: 0.22 },
          { id: 'segments', label: 'Segments', type: 'number', default: 16 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'color', label: 'Color', type: 'color', default: '#d4a83a' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'socksGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'feet', offsetY: 0, fallbackColor: '#d4a83a' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'ankleRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'ankleRadius' },
    { source: 'input', sourceHandle: 'calfRadius', target: 'gen', targetHandle: 'calfRadius' },
    { source: 'input', sourceHandle: 'height', target: 'gen', targetHandle: 'height' },
    { source: 'input', sourceHandle: 'segments', target: 'gen', targetHandle: 'segments' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'gen', targetHandle: 'legSpacing' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
