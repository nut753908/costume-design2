import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** pantsWaistScale(numberMultiply)+profile(easedLatheProfile)+legGen(latheGenerator)+
 * mirror(mirrorPair)+pantsMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Waist Radius/Hem Radius/Inseam/Segments/Color は他のガーメントと共有されない単独パラメータ
 * のため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * 脚1本ぶんのジオメトリ(`profile`→`legGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`bodyGroupNode.ts` の腕/脚の
 * `cylinderGenerator`→`mirrorPair` と同じ形、`nodes/CLAUDE.md` 参照)。
 *
 * Leg Spacing(`pantsLegSpacing`)は shoesGroup/socksGroup からも直接再引きされる外部の
 * numberInput ノードのまま残す(pantsGroup 内部には取り込まない)ため、Body Build(半径
 * スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * waistY)と合わせて外部ソケットのまま。 */
const output = garmentOutput({ color: { hex: '#9c7b4f', label: 'Pants Color' }, offsetY: 0, geometry: 'mirror' });

const scale = bodyBuildScale('waistRadiusIn');
const lathe = latheBody({ genId: 'legGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'hemRadiusIn', distance: 'inseamIn' });

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
          anchorYSocket,
        ],
      },
    },
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Waist Radius' } },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.1, min: 0.05, max: 0.2, step: 0.005, label: 'Hem Radius' } },
    { id: 'inseamIn', type: 'numberInput', data: { value: 0.75, min: 0.3, max: 1, step: 0.01, label: 'Inseam' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
    ...scale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...lathe.edges,
    { source: 'legGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
