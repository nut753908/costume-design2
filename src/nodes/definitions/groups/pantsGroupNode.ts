import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** pantsWaistScale(numberMultiply)+profile(easedLatheProfile)+legGen(latheGenerator)+
 * mirror(mirrorPair)+pantsMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Waist Radius と Hem Radius はどちらも Body Build を掛けてから lathe へ渡す(`scale`/
 * `hemScale`)。体の脚の半径がすべて Body Build でスケールされるため、裾を固定にすると
 * Body Build を上げたとき裾が脚の内側に入る。
 * Waist Radius/Hem Radius/Inseam/Segments/Color は他のガーメントと共有されない単独パラメータ
 * のため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 *
 * 脚1本ぶんのジオメトリ(`profile`→`legGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`limbPair.ts` の腕/脚の
 * `cylinderGenerator`→`mirrorPair` と同じ形、`nodes/CLAUDE.md` 参照)。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` が Body Build でスケールして計算する
 * `legSpacing`)を shoesGroup/socksGroup と共に受け取るため、Body Build(半径スケーリング用)・
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される waistY)と合わせて
 * 外部ソケットのまま。 */
const output = garmentOutput({ color: '#9c7b4f', offsetY: 0, geometry: 'mirror' });

const scale = bodyBuildScale('waistRadiusIn');
const hemScale = bodyBuildScale('hemRadiusIn', 'hemScale');
const lathe = latheBody({ genId: 'legGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'hemScale', distance: 'inseamIn' });

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
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.16} },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.1} },
    { id: 'inseamIn', type: 'numberInput', data: { value: 0.75} },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 16} },
    ...scale.nodes,
    ...hemScale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...hemScale.edges,
    ...lathe.edges,
    { source: 'legGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
