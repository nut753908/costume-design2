import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusSockets } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** bag の寸法の大半は独立したスタイル寄りの値だが、体の側面の位置(Hip Offset、胴体半径と
 * 同程度)と前面の深さ(`bagFrontDepthCalc`)だけは、胴体の壁の外側に置く必要があるため、
 * 体の胴体半径(外部ソケット Torso Radius)に倍率を掛けて求める(`hipOffsetScaled`/`bagFrontDepthCalc`)。
 * ストラップ・バッグ本体のどちらも完全にノードグラフへ展開されている。ストラップは
 * `alignedBoxGenerator`(`nodes/definitions/generic/alignedBoxGenerator.ts`、`geometry/
 * alignedBox.ts` の `buildAlignedBox()` を薄くラップした汎用プリミティブノード)で
 * 肩付近から反対の腰側までを結ぶ2点間に整列させて作り、バッグ本体(直方体)は
 * `boxGenerator`(汎用プリミティブノード)→`translate`(`generic/translate.ts`、X/Y/Z 軸の平行移動)という
 * ノードグラフへ展開している(`geometry/CLAUDE.md` 参照)。
 *
 * ストラップの終点(反対の腰側)とバッグ本体の中心座標 `bagCenter = strapEnd +
 * (0, -bagHeight/2, 0)`は同じ深さ(Z)を共有するため、
 * X: `negatedHipOffset = -(1.0 × torsoRadius)`(`numberNegate`)、Y(本体側): `bagCenterY =
 * negatedDrop - bagHeight * 0.5`、Z: `bagFrontDepthCalc = 0.69 × torsoRadius` という可視の四則演算
 * チェーンへ展開し、ストラップの `endX`/`endY`/`endZ` と本体の
 * `translate` の両方から同じ計算結果を参照する
 * (定数は各ノードの入力欄の値)。ストラップと
 * 本体は最後に `merge`(`mergeGeometry`)で1つにまとめる。複数のノードが同じ値を使うパラメータ(`bagHeightIn`)だけ `numberInput` を置いて配線し、
 * 他は numberInput/colorInput ノードを置かず、各ノードの入力欄の値として持つ。
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される shoulderY)と Torso Radius は外部ソケット。 */
const output = garmentOutput({ offsetY: 0, geometry: 'merge' });

defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          bodyRadiusSockets.torsoRadius,
          anchorYSocket,
          colorSocket('#8a4a2e'),
        ],
      },
    },
    { id: 'bagHeightIn', type: 'numberInput', data: { value: 0.14} },
    { id: 'bagFrontDepthCalc', type: 'numberMultiply', data: { value: 0.69 } },
    { id: 'hipOffsetScaled', type: 'numberMultiply', data: { value: 1 } },
    { id: 'strapGen', type: 'alignedBoxGenerator', data: { width: 0.04, thickness: 0.015, startX: 0.08, startZ: 0.05 } },
    { id: 'boxGen', type: 'boxGenerator', data: { width: 0.16, depth: 0.08 } },
    { id: 'negatedHipOffset', type: 'numberNegate', data: {} },
    { id: 'halfBagHeight', type: 'numberHalf', data: {} },
    { id: 'negatedDrop', type: 'numberNegate', data: { value: 0.55 } },
    { id: 'bagCenterY', type: 'numberSubtract', data: {} },
    { id: 'bodyTranslate', type: 'translate', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    // ストラップ = alignedBoxGenerator(肩付近 → 反対の腰側)。始点は (shoulderOffset, 0,
    // strapStartDepth)、終点はバッグ本体と共有する (negatedHipOffset, negatedDrop,
    // bagFrontDepth)(下記参照)。
    { source: 'negatedHipOffset', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endX' },
    { source: 'negatedDrop', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endY' },
    { source: 'bagFrontDepthCalc', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endZ' },

    { source: 'bagHeightIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'height' },

    { source: 'input', sourceHandle: 'torsoRadius', target: 'bagFrontDepthCalc', targetHandle: 'factor' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'hipOffsetScaled', targetHandle: 'factor' },
    { source: 'hipOffsetScaled', sourceHandle: 'value', target: 'negatedHipOffset', targetHandle: 'value' },

    { source: 'bagHeightIn', sourceHandle: 'value', target: 'halfBagHeight', targetHandle: 'value' },
    { source: 'negatedDrop', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'a' },
    { source: 'halfBagHeight', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'b' },

    { source: 'boxGen', sourceHandle: 'geometry', target: 'bodyTranslate', targetHandle: 'geometry' },
    { source: 'negatedHipOffset', sourceHandle: 'value', target: 'bodyTranslate', targetHandle: 'x' },
    { source: 'bagCenterY', sourceHandle: 'value', target: 'bodyTranslate', targetHandle: 'y' },
    { source: 'bagFrontDepthCalc', sourceHandle: 'value', target: 'bodyTranslate', targetHandle: 'z' },

    { source: 'strapGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'bodyTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
