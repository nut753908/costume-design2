import { defineGroupNode } from '../groupNodeFactory';
import { fixedBodyRadius } from '../garmentParts';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** scarf(マフラー)は、他のガーメントのように専用の `build*Geometry()` 関数を一切持たず、
 * 既存の汎用ノードだけを組み合わせて完全にノードグラフ上で表現されている。首元の輪
 * (`band`)は belt と共有する `bulgedBand`(`generic/bulgedBand.ts`)を `bulge=1.05` 固定で
 * ネストして再利用し(`geometry/CLAUDE.md` 参照)、タイ(`tail`、`boxGenerator`)は `translate`(`generic/translate.ts`、
 * X/Y/Z 軸の平行移動)で配置する。Y座標(`tailCenterY = (0 - bandThickness) - tailLength × 0.5`)/Z座標
 * (`tailCenterZ`、胸の前に垂らすためボディの胴体半径 × 1.2 の固定値で胴体の壁より前に置く)はどちらも可視の
 * 四則演算チェーンで導出する(`bandThickness` の符号反転は `numberNegate`、
 * 定数は各ノードの入力欄の値)。`band`/`tail`
 * は最後に `mergeGeometry` で1つにまとめる。
 *
 * Tail Width/Segments は他のガーメントと共有されない単独パラメータで、
 * 複数のノードが同じ値を使う Band Thickness/Tail Length(`bandThicknessIn`/`tailLengthIn`)だけ
 * `numberInput` を置いて配線し、他は numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * 首元の輪の半径(`scale`)はボディの首の半径 × 倍率の固定値。Anchor Y(取り付け位置、
 * ルートの `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0.08, geometry: 'merge' });

const scale = fixedBodyRadius('neckRadius', 1.8);

defineGroupNode({
  type: 'scarfGroup',
  label: 'Scarf',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          anchorYSocket,
          colorSocket('#8a2e3a'),
        ],
      },
    },
    { id: 'bandThicknessIn', type: 'numberInput', data: { value: 0.05} },
    { id: 'tailLengthIn', type: 'numberInput', data: { value: 0.35} },
    ...scale.nodes,
    { id: 'bandGen', type: 'bulgedBand', data: { bulge: 1.05, segments: 20 } },
    { id: 'tailGen', type: 'boxGenerator', data: { width: 0.09 } },
    { id: 'negatedBandThickness', type: 'numberNegate', data: {} },
    { id: 'halfTailLength', type: 'numberHalf', data: {} },
    { id: 'tailCenterY', type: 'numberSubtract', data: {} },
    { id: 'tailCenterZ', type: 'numberInput', data: { value: 1.2 * BODY_DIMENSIONS.torsoRadius } },
    { id: 'tailTranslate', type: 'translate', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,

    { source: 'scale', sourceHandle: 'value', target: 'bandGen', targetHandle: 'radius' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'bandGen', targetHandle: 'thickness' },

    { source: 'tailLengthIn', sourceHandle: 'value', target: 'tailGen', targetHandle: 'height' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'tailGen', targetHandle: 'depth' },

    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'negatedBandThickness', targetHandle: 'value' },
    { source: 'tailLengthIn', sourceHandle: 'value', target: 'halfTailLength', targetHandle: 'value' },
    { source: 'negatedBandThickness', sourceHandle: 'value', target: 'tailCenterY', targetHandle: 'a' },
    { source: 'halfTailLength', sourceHandle: 'value', target: 'tailCenterY', targetHandle: 'b' },


    { source: 'tailGen', sourceHandle: 'geometry', target: 'tailTranslate', targetHandle: 'geometry' },
    { source: 'tailCenterY', sourceHandle: 'value', target: 'tailTranslate', targetHandle: 'y' },
    { source: 'tailCenterZ', sourceHandle: 'value', target: 'tailTranslate', targetHandle: 'z' },

    { source: 'bandGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'tailTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
