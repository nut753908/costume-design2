import { defineGroupNode } from './groupNodeFactory';

/** sleeveGen(sleeveGenerator)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) を1枚にまとめたグループノード。Sleeve Radius/Sleeve Length は sleeve 固有の単独パラメータ
 * のため、外側の numberInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * Attach Radius(Body Build 適用後の Top の胴体半径と同じ値)と Material(Top と同じ
 * マテリアル)は、Top の生地と見た目を一致させるために Top と全く同じ値を受け取る必要がある
 * ため、`src/state/initialGraph.ts` 側の共有ノード(`topRadiusScale`/`topMaterial`、
 * topGroupNode.ts 参照)から topGroup と同時にファンアウトされる外部ソケットとして
 * 受け取る。Anchor Y(取り付け位置)も、ルートの `bodyLayout` 共有ノードの shoulderY を
 * topGroup と同時に受け取る(sleeve は top と同じ shoulder アンカーに取り付く)。 */
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
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'sleeveRadiusIn', type: 'numberInput', data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
    { id: 'sleeveLengthIn', type: 'numberInput', data: { value: 0.22, min: 0, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
    { id: 'gen', type: 'sleeveGenerator', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'attachRadius', target: 'gen', targetHandle: 'attachRadius' },
    { source: 'sleeveRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'sleeveRadius' },
    { source: 'sleeveLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'sleeveLength' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
