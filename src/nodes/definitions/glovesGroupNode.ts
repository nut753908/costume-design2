import { defineGroupNode } from './groupNodeFactory';

/** glovesWristScale(numberMultiply)+gloveGen(gloveGenerator)+mirror(mirrorPair)+
 * glovesMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の7ノードを1枚にまとめたグループノード。Wrist Radius/Hand Radius/
 * Length/Arm Spacing/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。Body Build
 * (半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線
 * される wristY)は外部ソケットのまま。
 *
 * 手袋1つぶんのジオメトリ(`gloveGen`)と、それを ±armSpacing だけ X方向に離した左右対称ペアへ
 * まとめる処理(`mirror`)は分離している — `pantsGroupNode.ts`/`bodyLimbGroupNode.ts` と同じ形
 * (`geometry/gloves.ts`/`nodes/CLAUDE.md` 参照)。以前は `glovesGenerator` という単一ノードが
 * `armSpacing` も受け取り、内部の `buildGlovesGeometry()`(`buildMirroredPairGeometry()` を
 * 呼ぶブラックボックス)へそのまま渡していた。 */
defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'wristRadiusIn', type: 'numberInput', data: { value: 0.08, min: 0.05, max: 0.12, step: 0.005, label: 'Wrist Radius' } },
    { id: 'handRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.16, step: 0.005, label: 'Hand Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Length' } },
    { id: 'armSpacingIn', type: 'numberInput', data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Arm Spacing' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#b0413e', label: 'Gloves Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gloveGen', type: 'gloveGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'wristRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gloveGen', targetHandle: 'wristRadius' },
    { source: 'handRadiusIn', sourceHandle: 'value', target: 'gloveGen', targetHandle: 'handRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gloveGen', targetHandle: 'length' },
    { source: 'gloveGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'armSpacingIn', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
