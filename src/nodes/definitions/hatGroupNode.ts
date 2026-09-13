import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が computeBodyDimensions で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * hatGen(hatGenerator)+hatMaterial(toonMaterial)+mesh(garmentMesh)+anchor(garmentAnchor)+
 * outputIO(groupOutput) の5ノードを1枚にまとめる。Brim Radius/Crown Radius/Height/Color も
 * 他のガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードでは
 * なくグループ内部の同型ノードとして保持する — 共有される外部入力ソケットが1つも無いため、
 * `groupInput` ノード自体を省略している(`defineGroupNode()` は groupInput は省略可、
 * groupOutput は必須)。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  internalNodes: [
    { id: 'brimRadiusIn', type: 'numberInput', data: { value: 0.2, min: 0.15, max: 0.3, step: 0.01, label: 'Brim Radius' } },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: 'Crown Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01, label: 'Height' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a3b6b', label: 'Hat Color' } },
    { id: 'gen', type: 'hatGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'mesh', type: 'garmentMesh', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'head', offsetY: 0.1 } },
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
    { source: 'brimRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'brimRadius' },
    { source: 'crownRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'crownRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'mesh', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'mesh', targetHandle: 'material' },
    { source: 'mesh', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'mesh', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchor', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'anchor', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
