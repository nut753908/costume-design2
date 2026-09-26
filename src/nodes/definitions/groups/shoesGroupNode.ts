import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** shoesSoleScale(numberMultiply)+profile(easedLatheCurve)+latheGen(latheGenerator)+
 * scaleZ(scale)+mirror(mirrorPair)+shoesMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の9ノードを1枚にまとめたグループノード。
 * Sole Radius と Cuff Radius はどちらも体の脚の半径(外部ソケット Leg Radius)に倍率を掛けてから
 * lathe へ渡す(`scale`/`cuffScale`、内部ノード id の `scale` とは別)。履き口を固定にすると、
 * 脚を太くしたとき履き口が脚の内側に入る。
 * Sole Radius/Cuff Radius/Height/Toe Length/Segments は他のガーメントと共有されない
 * 単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 靴1本ぶんのジオメトリ(`profile`→`latheGen`→`scaleZ`)と、それを ±legSpacing だけ X方向に
 * 離した左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。つま先方向に伸びた靴らしい
 * 楕円形のシルエットを作る `.scale(1, 1, toeLength)` は `scale`(X/Y/Z を持つ汎用の
 * 非一様スケールノード、`translate` と対になる形)の Z 入力欄だけを使って表現する。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` の `legSpacing`)を受け取る外部入力として、
 * Leg Radius・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
const output = garmentOutput({ offsetY: 0, geometry: 'mirror' });

const scale = bodyRadiusScale('legRadius', 1.18);
const cuffScale = bodyRadiusScale('legRadius', 0.91, 'cuffScale');
const lathe = latheBody({ genId: 'latheGen', direction: 'up', steps: 10, startRadius: 'scale', endRadius: 'cuffScale', distance: 0.12, segments: 16 });

defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes',
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
          colorSocket('#3d3630'),
        ],
      },
    },
    ...scale.nodes,
    ...cuffScale.nodes,
    ...lathe.nodes,
    { id: 'scaleZ', type: 'scale', data: { z: 1.5 } },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...cuffScale.edges,
    ...lathe.edges,
    { source: 'latheGen', sourceHandle: 'geometry', target: 'scaleZ', targetHandle: 'geometry' },
    { source: 'scaleZ', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
