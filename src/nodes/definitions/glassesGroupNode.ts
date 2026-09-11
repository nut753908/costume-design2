import { defineGroupNode } from './groupNodeFactory';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * glassesGen(glassesGenerator)+glassesMaterial(toonMaterial)+glassesOutput(garmentOutput)
 * の3ノードを1枚にまとめる。 */
defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'lensRadius', label: 'Lens Radius', type: 'number', default: 0.045 },
          { id: 'frameThickness', label: 'Frame Thickness', type: 'number', default: 0.008 },
          { id: 'lensSpacing', label: 'Lens Spacing', type: 'number', default: 0.055 },
          { id: 'bridgeThickness', label: 'Bridge Thickness', type: 'number', default: 0.01 },
          { id: 'templeLength', label: 'Temple Length', type: 'number', default: 0.12 },
          { id: 'templeThickness', label: 'Temple Thickness', type: 'number', default: 0.006 },
          { id: 'color', label: 'Color', type: 'color', default: '#2a2a2a' },
        ],
      },
    },
    { id: 'gen', type: 'glassesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: -0.02, fallbackColor: '#2a2a2a' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'lensRadius', target: 'gen', targetHandle: 'lensRadius' },
    { source: 'input', sourceHandle: 'frameThickness', target: 'gen', targetHandle: 'frameThickness' },
    { source: 'input', sourceHandle: 'lensSpacing', target: 'gen', targetHandle: 'lensSpacing' },
    { source: 'input', sourceHandle: 'bridgeThickness', target: 'gen', targetHandle: 'bridgeThickness' },
    { source: 'input', sourceHandle: 'templeLength', target: 'gen', targetHandle: 'templeLength' },
    { source: 'input', sourceHandle: 'templeThickness', target: 'gen', targetHandle: 'templeThickness' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
