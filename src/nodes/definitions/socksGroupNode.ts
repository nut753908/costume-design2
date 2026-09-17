import { defineGroupNode } from './groupNodeFactory';

/** socksAnkleScale(numberMultiply)+profile(easedLatheProfile)+sockGen(latheGenerator)+
 * mirror(mirrorPair)+socksMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Ankle Radius/Calf Radius/Height/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。
 *
 * 靴下1本ぶんのジオメトリ(`profile`→`sockGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `bodyLimbGroupNode.ts` と同じ形、`nodes/CLAUDE.md` 参照)。socks は shoes/hat と同じ
 * `direction: 'up'`(足首から上=ふくらはぎ側へ伸びる)。
 *
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build(半径スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
defineGroupNode({
  type: 'socksGroup',
  label: 'Socks',
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
    { id: 'ankleRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.15, step: 0.005, label: 'Ankle Radius' } },
    { id: 'calfRadiusIn', type: 'numberInput', data: { value: 0.105, min: 0.05, max: 0.2, step: 0.005, label: 'Calf Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.22, min: 0.08, max: 0.5, step: 0.01, label: 'Height' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d4a83a', label: 'Socks Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'up', steps: 10 } },
    { id: 'sockGen', type: 'latheGenerator', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'ankleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'calfRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'sockGen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'sockGen', targetHandle: 'segments' },
    { source: 'sockGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    { source: 'mirror', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
