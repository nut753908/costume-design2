import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** pantsWaistScale(numberMultiply)+profile(easedLatheCurve)+legGen(latheGenerator)+
 * mirror(mirrorPair)+pantsMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Waist Radius と Hem Radius はどちらも体の脚の半径(外部ソケット Leg Radius)に倍率を掛けてから
 * lathe へ渡す(`scale`/`hemScale`)。裾を固定にすると、脚を太くしたとき裾が脚の内側に入る。
 * Waist Radius/Hem Radius/Inseam/Segments は他のガーメントと共有されない単独パラメータ
 * のため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 脚1本ぶんのジオメトリ(`profile`→`legGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`limbPair.ts` の腕/脚の
 * `cylinderGenerator`→`mirrorPair` と同じ形、`nodes/CLAUDE.md` 参照)。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` の `legSpacing`)を
 * shoesGroup/socksGroup と共に受け取るため、Leg Radius・
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される waistY)と合わせて
 * 外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0, geometry: 'mirror' });

const scale = bodyRadiusScale('legRadius', 1.45);
const hemScale = bodyRadiusScale('legRadius', 0.91, 'hemScale');
const lathe = latheBody({ genId: 'legGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'hemScale', distance: 0.75, segments: 16 });

defineGroupNode({
  type: 'pantsGroup',
  label: 'Pants',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          bodyRadiusSockets.legRadius,
          anchorYSocket,
          colorSocket('#9c7b4f'),
        ],
      },
    },
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
