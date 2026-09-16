import { defineGroupNode } from './groupNodeFactory';

/** shoesSoleScale(numberMultiply)+shoeGen(shoeGenerator)+mirror(mirrorPair)+
 * shoesMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の7ノードを1枚にまとめたグループノード。Sole Radius/Cuff Radius/
 * Height/Toe Length/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * 靴1本ぶんのジオメトリ(`shoeGen`)と、それを ±legSpacing だけ X方向に離した左右対称ペアへ
 * まとめる処理(`mirror`)は分離している — `pantsGroupNode.ts`/`bodyLimbGroupNode.ts` と同じ形
 * (`geometry/shoes.ts`/`nodes/CLAUDE.md` 参照)。以前は `shoesGenerator` という単一ノードが
 * `legSpacing` も受け取り、内部の `buildShoesGeometry()`(`buildMirroredPairGeometry()` を
 * 呼ぶブラックボックス)へそのまま渡していた。
 *
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build(半径スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'soleRadiusIn', type: 'numberInput', data: { value: 0.13, min: 0.1, max: 0.2, step: 0.005, label: 'Sole Radius' } },
    { id: 'cuffRadiusIn', type: 'numberInput', data: { value: 0.1, min: 0.08, max: 0.16, step: 0.005, label: 'Cuff Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.25, step: 0.005, label: 'Height' } },
    { id: 'toeLengthIn', type: 'numberInput', data: { value: 1.5, min: 1, max: 2.5, step: 0.05, label: 'Toe Length' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#3d3630', label: 'Shoes Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'shoeGen', type: 'shoeGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'soleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'shoeGen', targetHandle: 'soleRadius' },
    { source: 'cuffRadiusIn', sourceHandle: 'value', target: 'shoeGen', targetHandle: 'cuffRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'shoeGen', targetHandle: 'height' },
    { source: 'toeLengthIn', sourceHandle: 'value', target: 'shoeGen', targetHandle: 'toeLength' },
    { source: 'shoeGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
