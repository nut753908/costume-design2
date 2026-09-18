import { defineGroupNode } from '../groupNodeFactory';
import { garmentOutput } from '../garmentOutput';

/** shoesSoleScale(numberMultiply)+profile(easedLatheProfile)+latheGen(latheGenerator)+
 * scaleZ(scaleZ)+mirror(mirrorPair)+shoesMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の9ノードを1枚にまとめたグループノード。
 * Sole Radius/Cuff Radius/Height/Toe Length/Segments/Color は他のガーメントと共有されない
 * 単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型
 * ノードとして保持する。
 *
 * 靴1本ぶんのジオメトリ(`profile`→`latheGen`→`scaleZ`)と、それを ±legSpacing だけ X方向に
 * 離した左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `bodyGroupNode.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。つま先方向に伸びた靴らしい
 * 楕円形のシルエットを作る `.scale(1, 1, toeLength)` は `scaleZ`(`translateX`/`translateY`/
 * `translateZ` と対になる、1軸だけを扱う汎用の非一様スケールノード)で表現する。
 *
 * Leg Spacing は pants の生パラメータノード(`pantsLegSpacing`)を再引きする外部入力として、
 * Body Build(半径スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
const output = garmentOutput({ color: { hex: '#3d3630', label: 'Shoes Color' }, offsetY: 0, geometry: 'mirror' });

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
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'up', steps: 10 } },
    { id: 'latheGen', type: 'latheGenerator', data: {} },
    { id: 'scaleZ', type: 'scaleZ', data: {} },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'soleRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'cuffRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'latheGen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'latheGen', targetHandle: 'segments' },
    { source: 'latheGen', sourceHandle: 'geometry', target: 'scaleZ', targetHandle: 'geometry' },
    { source: 'toeLengthIn', sourceHandle: 'value', target: 'scaleZ', targetHandle: 'z' },
    { source: 'scaleZ', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
