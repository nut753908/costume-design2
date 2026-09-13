import { defineGroupNode } from './groupNodeFactory';

/** sleeveGen(sleeveGenerator)+anchorIn(enumInput)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) を1枚にまとめたグループノード。Sleeve Radius/Sleeve Length は sleeve 固有の単独パラメータ
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
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'sleeveRadiusIn', type: 'numberInput', data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
    { id: 'sleeveLengthIn', type: 'numberInput', data: { value: 0.22, min: 0, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
    { id: 'gen', type: 'sleeveGenerator', data: {} },
    { id: 'anchorIn', type: 'enumInput', data: { value: 'shoulder', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
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
    { source: 'anchorIn', sourceHandle: 'value', target: 'placement', targetHandle: 'anchor' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
