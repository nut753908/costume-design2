import { defineGroupNode } from '../groupNodeFactory';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import { fixedBodyRadius, latheBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** shoesSoleScale(numberInput)+profile(easedLatheCurve)+latheGen(latheGenerator)+
 * scaleZ(scale)+mirror(mirrorPair)+shoesMaterial(toonMaterial)+
 * placement(translate)+sceneOut(sceneOutput)の9ノードを1枚にまとめたグループノード。
 * Sole Radius と Cuff Radius は、どちらもボディの脚の半径に倍率を掛けた固定値(`scale`/`cuffScale`、`fixedBodyRadius()`)。
 * Sole Radius/Cuff Radius/Height/Toe Length/Segments は他のガーメントと共有されない
 * 単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 靴1本ぶんのジオメトリ(`profile`→`latheGen`→`scaleZ`)と、それを ±legSpacing だけ X方向に
 * 離した左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。つま先方向に伸びた靴らしい
 * 楕円形のシルエットを作る `.scale(1, 1, toeLength)` は `scale`(X/Y/Z を持つ汎用の
 * 非一様スケールノード、`translate` と対になる形)の Z 入力欄だけを使って表現する。
 *
 * Leg Spacing(`legSpacing`)は bodyGroup の脚と同じ値(ボディの基準寸法)の固定値。 */
const output = garmentOutput({ y: 0, geometry: 'mirror' });

const scale = fixedBodyRadius('legRadius', 1.3);
const cuffScale = fixedBodyRadius('legRadius', 0.91, 'cuffScale');
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
          colorSocket('#3d3630'),
        ],
      },
    },
    { id: 'legSpacing', type: 'numberInput', data: { value: BODY_DIMENSIONS.legSpacing } },
    ...scale.nodes,
    ...cuffScale.nodes,
    ...lathe.nodes,
    { id: 'scaleZ', type: 'scale', data: { z: 1.95 } },
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...cuffScale.edges,
    ...lathe.edges,
    { source: 'latheGen', sourceHandle: 'geometry', target: 'scaleZ', targetHandle: 'geometry' },
    { source: 'scaleZ', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'legSpacing', sourceHandle: 'value', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
