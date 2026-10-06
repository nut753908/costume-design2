import { defineGroupNode } from '../groupNodeFactory';
import { fixedBodyRadius, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** 足首半径とふくらはぎ半径は、どちらもボディの脚の半径に倍率を掛けた固定値(`scale`/`calfScale`、`fixedBodyRadius()`)。
 * socksAnkleScale(numberInput)+profile(easedLatheCurve)+sockGen(latheGenerator)+
 * mirror(mirrorPair)+socksMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Ankle Radius/Calf Radius/Height/Segments は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 靴下1本ぶんのジオメトリ(`profile`→`sockGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。socks は shoes/hat と同じ
 * `direction: 'up'`(足首から上=ふくらはぎ側へ伸びる)。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` の `legSpacing`)を受け取る外部入力として、
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
const output = garmentOutput({ offsetY: 0.09, geometry: 'mirror' });

const scale = fixedBodyRadius('legRadius', 0.92);
const calfScale = fixedBodyRadius('legRadius', 0.95, 'calfScale');
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
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.08 },
          anchorYSocket,
          colorSocket('#d4a83a'),
        ],
      },
    },
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
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
