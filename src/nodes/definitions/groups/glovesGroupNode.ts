import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** 手首半径と手の半径はどちらも体の腕の半径(外部ソケット Arm Radius)に倍率を掛けてから
 * lathe へ渡す(`scale`/`handScale`)。手袋全体の大きさを腕の太さに揃えるため。
 * glovesWristScale(numberMultiply)+profile(easedLatheCurve)+gloveGen(latheGenerator)+
 * mirror(mirrorPair)+glovesMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Arm Radius・Arm Spacing(bodyGroup の腕と同じ
 * `bodyDimensions.shoulderSpacing`)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される wristY)は外部ソケットのまま。
 *
 * 手袋1つぶんのジオメトリ(`profile`→`gloveGen`)と、それを ±armSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。 */
const output = garmentOutput({ offsetY: 0, geometry: 'mirror' });

const scale = bodyRadiusScale('armRadius', 1.07);
const handScale = bodyRadiusScale('armRadius', 1.2, 'handScale');
const lathe = latheBody({ genId: 'gloveGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'handScale', distance: 0.14, segments: 12 });

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
          { id: 'armSpacing', label: 'Arm Spacing', type: 'number', default: 0.34 },
          bodyRadiusSockets.armRadius,
          anchorYSocket,
          colorSocket('#b0413e'),
        ],
      },
    },
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
    { source: 'input', sourceHandle: 'armSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
