import { defineGroupNode } from './groupNodeFactory';

/** necktie は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * necktieGen(necktieGenerator)+necktieMaterial(toonMaterial)+necktieOutput(garmentOutput)
 * の3ノードを1枚にまとめる。 */
defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'knotWidth', label: 'Knot Width', type: 'number', default: 0.05 },
          { id: 'knotHeight', label: 'Knot Height', type: 'number', default: 0.04 },
          { id: 'knotThickness', label: 'Knot Thickness', type: 'number', default: 0.025 },
          { id: 'bladeTopWidth', label: 'Blade Top Width', type: 'number', default: 0.035 },
          { id: 'bladeBottomWidth', label: 'Blade Bottom Width', type: 'number', default: 0.06 },
          { id: 'bladeThickness', label: 'Blade Thickness', type: 'number', default: 0.008 },
          { id: 'bladeLength', label: 'Blade Length', type: 'number', default: 0.4 },
          { id: 'color', label: 'Color', type: 'color', default: '#7a1f2b' },
        ],
      },
    },
    { id: 'gen', type: 'necktieGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#7a1f2b' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'knotWidth', target: 'gen', targetHandle: 'knotWidth' },
    { source: 'input', sourceHandle: 'knotHeight', target: 'gen', targetHandle: 'knotHeight' },
    { source: 'input', sourceHandle: 'knotThickness', target: 'gen', targetHandle: 'knotThickness' },
    { source: 'input', sourceHandle: 'bladeTopWidth', target: 'gen', targetHandle: 'bladeTopWidth' },
    { source: 'input', sourceHandle: 'bladeBottomWidth', target: 'gen', targetHandle: 'bladeBottomWidth' },
    { source: 'input', sourceHandle: 'bladeThickness', target: 'gen', targetHandle: 'bladeThickness' },
    { source: 'input', sourceHandle: 'bladeLength', target: 'gen', targetHandle: 'bladeLength' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
