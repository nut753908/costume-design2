import { defineGroupNode } from '../groupNodeFactory';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import { fixedBodyRadius, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** 手首半径と手の半径は、どちらもボディの腕の半径に倍率を掛けた固定値(`scale`/`handScale`、`fixedBodyRadius()`)。
 * glovesWristScale(numberInput)+profile(easedLatheCurve)+gloveGen(latheGenerator)+
 * mirror(mirrorPair)+glovesMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Arm Spacing(`armSpacing`)は bodyGroup の腕と同じ値(ボディの肩幅の基準寸法)の固定値。
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される wristY)は外部ソケットのまま。
 *
 * 手袋1つぶんのジオメトリ(`profile`→`gloveGen`)と、それを ±armSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。 */
const output = garmentOutput({ offsetY: 0.04, geometry: 'mirror' });

const scale = fixedBodyRadius('armRadius', 1.4);
const handScale = fixedBodyRadius('armRadius', 1.55, 'handScale');
const lathe = latheBody({ genId: 'gloveGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'handScale', distance: 0.16, segments: 12 });

defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          anchorYSocket,
          colorSocket('#b0413e'),
        ],
      },
    },
    { id: 'armSpacing', type: 'numberInput', data: { value: BODY_DIMENSIONS.shoulderSpacing } },
    ...scale.nodes,
    ...handScale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...handScale.edges,
    ...lathe.edges,
    { source: 'gloveGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'armSpacing', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
