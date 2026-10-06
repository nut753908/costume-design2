import { defineGroupNode } from '../groupNodeFactory';
import { radiusInput, latheBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** 手首半径と手の半径は、どちらも固定値(`scale`/`handScale`)。
 * glovesWristScale(numberInput)+profile(easedLatheCurve)+gloveGen(latheGenerator)+
 * mirror(mirrorPair)+glovesMaterial(toonMaterial)+
 * placement(translate)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Arm Spacing(`armSpacing`)は 固定値。
 *
 * 手袋1つぶんのジオメトリ(`profile`→`gloveGen`)と、それを ±armSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。 */
const output = garmentOutput({ y: 0.66572, geometry: 'mirror' });

const scale = radiusInput(0.07322);
const handScale = radiusInput(0.081065, 'handScale');
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
          colorSocket('#b0413e'),
        ],
      },
    },
    { id: 'armSpacing', type: 'numberInput', data: { value: 0.1443 } },
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
