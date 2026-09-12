import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が computeBodyDimensions で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * hatGen(hatGenerator)+hatMaterial(toonMaterial)+hatOutput(garmentOutput) の3ノードを
 * 1枚にまとめる。Brim Radius/Crown Radius/Height/Color も他のガーメントと共有されない
 * 単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型
 * ノードとして保持する — 共有される外部ソケットが1つも無いため、この groupInput ノードは
 * ソケットを持たない(`sockets: []`)。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: { sockets: [] },
    },
    { id: 'brimRadiusIn', type: 'numberInput', data: { value: 0.2, min: 0.15, max: 0.3, step: 0.01, label: 'Brim Radius' } },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: 'Crown Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01, label: 'Height' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a3b6b', label: 'Hat Color' } },
    { id: 'gen', type: 'hatGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: 0.1, fallbackColor: '#4a3b6b' } },
  ],
  internalEdges: [
    { source: 'brimRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'brimRadius' },
    { source: 'crownRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'crownRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
