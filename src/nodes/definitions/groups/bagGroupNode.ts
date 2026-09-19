import { defineGroupNode } from '../groupNodeFactory';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { constNumberInput } from '../constNumberInput';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ストラップ・バッグ本体のどちらも完全にノードグラフへ展開されている。ストラップは
 * `alignedBoxGenerator`(`nodes/definitions/generic/alignedBoxGenerator.ts`、`geometry/
 * alignedBox.ts` の `buildAlignedBox()` を薄くラップした汎用プリミティブノード)で
 * 肩付近から反対の腰側までを結ぶ2点間に整列させて作り、バッグ本体(直方体)は
 * `boxGenerator`(汎用プリミティブノード)→`translateX`/`translateY`/`translateZ` という
 * ノードグラフへ展開している(`geometry/CLAUDE.md` 参照)。
 *
 * ストラップの終点(反対の腰側)とバッグ本体の中心座標 `bagCenter = strapEnd +
 * (0, -bagHeight/2, 0)`は同じ深さ(Z)を共有するため、
 * X: `negatedHipOffset = -hipOffset`(`numberNegate`)、Y(本体側): `bagCenterY =
 * negatedDrop - bagHeight * 0.5`、Z: 固定値 `bagFrontDepthIn` という可視の四則演算
 * チェーンへ展開し、ストラップの `endX`/`endY`/`endZ` と本体の
 * `translateX`/`translateY`/`translateZ` の両方から同じ計算結果を参照する
 * (`zeroIn`/`strapStartDepthIn`/`bagFrontDepthIn` は `constNumberInput()` で
 * 定義する「常に一定の値を持つ `numberInput`」)。ストラップと
 * 本体は最後に `merge`(`mergeGeometry`)で1つにまとめる。全パラメータが他のガーメントと
 * 共有されない単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ
 * 内部の同型ノードとして保持する。Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される shoulderY)だけが唯一の外部ソケット。 */
const output = garmentOutput({ color: { hex: '#8a4a2e', label: 'Bag Color' }, offsetY: 0, geometry: 'merge' });

defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [anchorYSocket],
      },
    },
    { id: 'strapWidthIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.08, step: 0.005, label: 'Strap Width' } },
    { id: 'strapThicknessIn', type: 'numberInput', data: { value: 0.015, min: 0.005, max: 0.03, step: 0.005, label: 'Strap Thickness' } },
    { id: 'shoulderOffsetIn', type: 'numberInput', data: { value: 0.08, min: 0, max: 0.2, step: 0.01, label: 'Shoulder Offset' } },
    { id: 'hipOffsetIn', type: 'numberInput', data: { value: 0.26, min: 0, max: 0.4, step: 0.01, label: 'Hip Offset' } },
    { id: 'dropIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 0.9, step: 0.01, label: 'Drop' } },
    { id: 'bagWidthIn', type: 'numberInput', data: { value: 0.16, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Width' } },
    { id: 'bagHeightIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Height' } },
    { id: 'bagDepthIn', type: 'numberInput', data: { value: 0.08, min: 0.02, max: 0.2, step: 0.01, label: 'Bag Depth' } },
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('strapStartDepthIn', 0.05, 'Strap Start Depth'),
    constNumberInput('bagFrontDepthIn', 0.18, 'Bag Front Depth'),
    { id: 'strapGen', type: 'alignedBoxGenerator', data: {} },
    { id: 'boxGen', type: 'boxGenerator', data: {} },
    { id: 'negatedHipOffset', type: 'numberNegate', data: { label: 'Negated Hip Offset' } },
    { id: 'halfBagHeight', type: 'numberHalf', data: { label: 'Bag Height × Half' } },
    { id: 'negatedDrop', type: 'numberNegate', data: { label: 'Negated Drop' } },
    { id: 'bagCenterY', type: 'numberSubtract', data: { label: 'Bag Center Y' } },
    { id: 'bodyTranslateX', type: 'translateX', data: {} },
    { id: 'bodyTranslateY', type: 'translateY', data: {} },
    { id: 'bodyTranslateZ', type: 'translateZ', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    // ストラップ = alignedBoxGenerator(肩付近 → 反対の腰側)。始点は (shoulderOffset, 0,
    // strapStartDepth)、終点はバッグ本体と共有する (negatedHipOffset, negatedDrop,
    // bagFrontDepth)(下記参照)。
    { source: 'strapWidthIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'width' },
    { source: 'strapThicknessIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'thickness' },
    { source: 'shoulderOffsetIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'startY' },
    { source: 'strapStartDepthIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'startZ' },
    { source: 'negatedHipOffset', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endX' },
    { source: 'negatedDrop', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endY' },
    { source: 'bagFrontDepthIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'endZ' },

    { source: 'bagWidthIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'width' },
    { source: 'bagHeightIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'height' },
    { source: 'bagDepthIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'depth' },

    { source: 'hipOffsetIn', sourceHandle: 'value', target: 'negatedHipOffset', targetHandle: 'value' },

    { source: 'bagHeightIn', sourceHandle: 'value', target: 'halfBagHeight', targetHandle: 'value' },
    { source: 'dropIn', sourceHandle: 'value', target: 'negatedDrop', targetHandle: 'value' },
    { source: 'negatedDrop', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'a' },
    { source: 'halfBagHeight', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'b' },

    { source: 'boxGen', sourceHandle: 'geometry', target: 'bodyTranslateX', targetHandle: 'geometry' },
    { source: 'negatedHipOffset', sourceHandle: 'value', target: 'bodyTranslateX', targetHandle: 'x' },
    { source: 'bodyTranslateX', sourceHandle: 'geometry', target: 'bodyTranslateY', targetHandle: 'geometry' },
    { source: 'bagCenterY', sourceHandle: 'value', target: 'bodyTranslateY', targetHandle: 'y' },
    { source: 'bodyTranslateY', sourceHandle: 'geometry', target: 'bodyTranslateZ', targetHandle: 'geometry' },
    { source: 'bagFrontDepthIn', sourceHandle: 'value', target: 'bodyTranslateZ', targetHandle: 'z' },

    { source: 'strapGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'bodyTranslateZ', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
