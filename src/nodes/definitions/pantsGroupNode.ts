import { defineGroupNode } from './groupNodeFactory';

/** pantsWaistScale(numberMultiply)+legGen(pantsLegGenerator)+mirror(mirrorPair)+
 * pantsMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の7ノードを1枚にまとめたグループノード。Waist Radius/Hem Radius/
 * Inseam/Segments/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * 脚1本ぶんのジオメトリ(`legGen`)と、それを ±legSpacing だけ X方向に離した左右対称ペアへ
 * まとめる処理(`mirror`)は分離している — `bodyLimbGroupNode.ts` の
 * `cylinderGenerator`→`mirrorPair` と同じ形(`geometry/pants.ts`/`nodes/CLAUDE.md` 参照)。
 * 以前は `pantsGenerator` という単一ノードが `legSpacing` も受け取り、内部の
 * `buildPantsGeometry()`(`buildMirroredPairGeometry()` を呼ぶブラックボックス)へそのまま
 * 渡していた。
 *
 * Leg Spacing(`pantsLegSpacing`)は shoesGroup/socksGroup からも直接再引きされる外部の
 * numberInput ノードのまま残す(pantsGroup 内部には取り込まない)ため、Body Build(半径
 * スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * waistY)と合わせて外部ソケットのまま。 */
defineGroupNode({
  type: 'pantsGroup',
  label: 'Pants',
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
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Waist Radius' } },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.1, min: 0.05, max: 0.2, step: 0.005, label: 'Hem Radius' } },
    { id: 'inseamIn', type: 'numberInput', data: { value: 0.75, min: 0.3, max: 1, step: 0.01, label: 'Inseam' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#9c7b4f', label: 'Pants Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'legGen', type: 'pantsLegGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'waistRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'legGen', targetHandle: 'waistRadius' },
    { source: 'hemRadiusIn', sourceHandle: 'value', target: 'legGen', targetHandle: 'hemRadius' },
    { source: 'inseamIn', sourceHandle: 'value', target: 'legGen', targetHandle: 'inseam' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'legGen', targetHandle: 'segments' },
    { source: 'legGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
