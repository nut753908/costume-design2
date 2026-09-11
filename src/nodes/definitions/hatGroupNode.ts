import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が computeBodyDimensions で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * hatGen(hatGenerator)+hatMaterial(toonMaterial)+hatOutput(garmentOutput) の3ノードを
 * 1枚にまとめる。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'brimRadius', label: 'Brim Radius', type: 'number', default: 0.2 },
          { id: 'crownRadius', label: 'Crown Radius', type: 'number', default: 0.02 },
          { id: 'height', label: 'Height', type: 'number', default: 0.35 },
          { id: 'color', label: 'Color', type: 'color', default: '#4a3b6b' },
        ],
      },
    },
    { id: 'gen', type: 'hatGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: 0.1, fallbackColor: '#4a3b6b' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'brimRadius', target: 'gen', targetHandle: 'brimRadius' },
    { source: 'input', sourceHandle: 'crownRadius', target: 'gen', targetHandle: 'crownRadius' },
    { source: 'input', sourceHandle: 'height', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
