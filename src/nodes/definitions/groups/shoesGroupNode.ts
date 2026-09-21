import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** shoesSoleScale(numberMultiply)+profile(easedLatheProfile)+latheGen(latheGenerator)+
 * scaleZ(scaleZ)+mirror(mirrorPair)+shoesMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の9ノードを1枚にまとめたグループノード。
 * Sole Radius と Cuff Radius はどちらも Body Build を掛けてから lathe へ渡す(`scale`/
 * `cuffScale`)。体の脚の半径がすべて Body Build でスケールされるため、履き口を固定にすると
 * Body Build を上げたとき履き口が脚の内側に入る。
 * Sole Radius/Cuff Radius/Height/Toe Length/Segments は他のガーメントと共有されない
 * 単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 靴1本ぶんのジオメトリ(`profile`→`latheGen`→`scaleZ`)と、それを ±legSpacing だけ X方向に
 * 離した左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。つま先方向に伸びた靴らしい
 * 楕円形のシルエットを作る `.scale(1, 1, toeLength)` は `scaleZ`(`translateX`/`translateY`/
 * `translateZ` と対になる、1軸だけを扱う汎用の非一様スケールノード)で表現する。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` の `legSpacing`)を受け取る外部入力として、
 * Body Build(半径スケーリング用)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される feetY)と合わせて外部ソケットのまま受け取る。 */
const output = garmentOutput({ offsetY: 0, geometry: 'mirror' });

const scale = bodyBuildScale(0.13);
const cuffScale = bodyBuildScale(0.1, 'cuffScale');
const lathe = latheBody({ genId: 'latheGen', direction: 'up', steps: 10, startRadius: 'scale', endRadius: 'cuffScale', distance: 0.12, segments: 16 });

defineGroupNode({
  type: 'shoesGroup',
  label: 'Shoes Group',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.14 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
          colorSocket('#3d3630'),
        ],
      },
    },
    ...scale.nodes,
    ...cuffScale.nodes,
    ...lathe.nodes,
    { id: 'scaleZ', type: 'scaleZ', data: { z: 1.5 } },
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
