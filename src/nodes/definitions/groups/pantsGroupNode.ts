import { defineGroupNode } from '../groupNodeFactory';
import { fixedBodyRadius, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** pantsWaistScale(numberInput)+profile(easedLatheCurve)+legGen(latheGenerator)+
 * mirror(mirrorPair)+pantsMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * 腰側の Waist Radius は腰(お尻)を包むのでボディの胴体半径、裾の
 * Hem Radius は脚の半径に、それぞれ倍率を掛けた固定値(`scale`/`hemScale`、`fixedBodyRadius()`)。
 * Waist Radius は脚の半径 × 1.1(`waistMin`)を下限にする(`waistRadius`、`numberMax`)ので、
 * 値を編集しても腰が脚に埋もれない。
 * Waist Radius/Hem Radius/Inseam/Segments は他のガーメントと共有されない単独パラメータ
 * のため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 脚1本ぶんのジオメトリ(`profile`→`legGen`)と、それを ±legSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`limbPair.ts` の腕/脚の
 * `cylinderGenerator`→`mirrorPair` と同じ形、`nodes/CLAUDE.md` 参照)。
 *
 * Leg Spacing は bodyGroup の脚と同じ値(`bodyDimensions` の `legSpacing`)を
 * shoesGroup/socksGroup と共に受け取るため、Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される waistY)と合わせて
 * 外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0.1, geometry: 'mirror' });

const scale = fixedBodyRadius('torsoRadius', 0.62);
const hemScale = fixedBodyRadius('legRadius', 0.91, 'hemScale');
const waistMin = fixedBodyRadius('legRadius', 1.1, 'waistMin');
const lathe = latheBody({ genId: 'legGen', direction: 'down', steps: 10, startRadius: 'waistRadius', endRadius: 'hemScale', distance: 1.04, segments: 16 });

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
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.08 },
          anchorYSocket,
          colorSocket('#9c7b4f'),
        ],
      },
    },
    ...scale.nodes,
    ...waistMin.nodes,
    { id: 'waistRadius', type: 'numberMax', data: {} },
    ...hemScale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...waistMin.edges,
    { source: 'scale', sourceHandle: 'value', target: 'waistRadius', targetHandle: 'a' },
    { source: 'waistMin', sourceHandle: 'value', target: 'waistRadius', targetHandle: 'b' },
    ...hemScale.edges,
    ...lathe.edges,
    { source: 'legGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'legSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
