import { defineGroupNode } from '../groupNodeFactory';
import { radiusInput, latheBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** 足首半径とふくらはぎ半径は、どちらも固定値(`scale`/`calfScale`)。
 * socksAnkleScale(numberInput)+profile(easedLatheCurve)+sockGen(latheGenerator)+
 * mirror(mirrorPair)+socksMaterial(toonMaterial)+
 * placement(translate)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Ankle Radius/Calf Radius/Height/Segments は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 靴下1本ぶんのジオメトリ(`profile`→`sockGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。socks は shoes/hat と同じ
 * `direction: 'up'`(足首から上=ふくらはぎ側へ伸びる)。
 *
 * Leg Spacing(`legSpacing`)は 固定値。 */
const output = garmentOutput({ y: 0.09, geometry: 'mirror' });

const scale = radiusInput(0.063572);
const calfScale = radiusInput(0.065645, 'calfScale');
const lathe = latheBody({ genId: 'sockGen', direction: 'up', steps: 10, startRadius: 'scale', endRadius: 'calfScale', distance: 0.22, segments: 16 });

defineGroupNode({
  type: 'socksGroup',
  label: 'Socks',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          colorSocket('#d4a83a'),
        ],
      },
    },
    { id: 'legSpacing', type: 'numberInput', data: { value: 0.1109 } },
    ...scale.nodes,
    ...calfScale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...calfScale.edges,
    ...lathe.edges,
    { source: 'sockGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'legSpacing', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
