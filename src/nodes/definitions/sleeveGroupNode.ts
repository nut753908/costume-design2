import { defineGroupNode } from './groupNodeFactory';

/** sleeveGen(sleeveGenerator)+mesh(garmentMesh)+anchor(garmentAnchor)+outputIO(groupOutput)
 * を1枚にまとめたグループノード。Sleeve Radius/Sleeve Length は sleeve 固有の単独パラメータ
 * のため、外側の numberInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * Attach Radius(Body Build 適用後の Top の胴体半径と同じ値)と Material(Top と同じ
 * マテリアル)は、Top の生地と見た目を一致させるために Top と全く同じ値を受け取る必要がある
 * ため、`src/state/initialGraph.ts` 側の共有ノード(`topRadiusScale`/`topMaterial`、
 * topGroupNode.ts 参照)から topGroup と同時にファンアウトされる外部ソケットとして
 * 受け取る。 */
defineGroupNode({
  type: 'sleeveGroup',
  label: 'Sleeves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'attachRadius', label: 'Attach Radius', type: 'number', default: 0.29 },
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'sleeveRadiusIn', type: 'numberInput', data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
    { id: 'sleeveLengthIn', type: 'numberInput', data: { value: 0.22, min: 0, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
    { id: 'gen', type: 'sleeveGenerator', data: {} },
    { id: 'mesh', type: 'garmentMesh', data: {} },
    { id: 'anchor', type: 'garmentAnchor', data: { anchor: 'shoulder', offsetY: 0 } },
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
    { source: 'input', sourceHandle: 'attachRadius', target: 'gen', targetHandle: 'attachRadius' },
    { source: 'sleeveRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'sleeveRadius' },
    { source: 'sleeveLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'sleeveLength' },
    { source: 'gen', sourceHandle: 'geometry', target: 'mesh', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'mesh', targetHandle: 'material' },
    { source: 'mesh', sourceHandle: 'geometry', target: 'outputIO', targetHandle: 'geometry' },
    { source: 'mesh', sourceHandle: 'material', target: 'outputIO', targetHandle: 'material' },
    { source: 'anchor', sourceHandle: 'anchor', target: 'outputIO', targetHandle: 'anchor' },
    { source: 'anchor', sourceHandle: 'offsetY', target: 'outputIO', targetHandle: 'offsetY' },
  ],
});
