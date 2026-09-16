import { defineGroupNode } from './groupNodeFactory';

/** bag は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ストラップ(strapGen、`bagStrapGenerator`)は `alignedBox.ts`(2点間に整列させる回転+
 * 平行移動)を使う処理がまだノード化されていないためコード側に残っているが、バッグ本体
 * (直方体)は `boxGenerator`(汎用プリミティブノード)→`translateX`/`translateY`/
 * `translateZ` というノードグラフへ展開している(`geometry/bag.ts`/`geometry/CLAUDE.md`
 * 参照)。
 *
 * バッグ本体の中心座標 `bagCenter = strapEnd + (0, -bagHeight/2, 0)`(旧コードの式)を、
 * X: `negatedHipOffset = 0 - hipOffset`、Y: `bagCenterY = (0 - drop) - bagHeight * 0.5`、
 * Z: 固定値 `bagFrontDepthIn`(`geometry/bag.ts` の `BAG_FRONT_DEPTH` と同じ数値、
 * ストラップの終端と同じ深さに置く)という可視の四則演算チェーンへ展開している
 * (`zeroIn`/`halfIn` は `bodyLayoutGroupNode.ts` の `halfIn`/`feetYIn` と同じ「常に一定の
 * 値を持つ `numberInput`」のイディオム)。ストラップと本体は最後に `merge`
 * (`mergeGeometry`)で1つにまとめる。全パラメータが他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノード
 * として保持する。Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * shoulderY)だけが唯一の外部ソケット。 */
defineGroupNode({
  type: 'bagGroup',
  label: 'Bag',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 }],
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
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a4a2e', label: 'Bag Color' } },
    { id: 'zeroIn', type: 'numberInput', data: { value: 0, min: 0, max: 0, step: 0.01, label: 'Zero' } },
    { id: 'halfIn', type: 'numberInput', data: { value: 0.5, min: 0.5, max: 0.5, step: 0.01, label: 'Half' } },
    { id: 'bagFrontDepthIn', type: 'numberInput', data: { value: 0.18, min: 0.18, max: 0.18, step: 0.01, label: 'Bag Front Depth' } },
    { id: 'strapGen', type: 'bagStrapGenerator', data: {} },
    { id: 'boxGen', type: 'boxGenerator', data: {} },
    { id: 'negatedHipOffset', type: 'numberSubtract', data: { label: 'Negated Hip Offset' } },
    { id: 'halfBagHeight', type: 'numberMultiply', data: { label: 'Bag Height × Half' } },
    { id: 'negatedDrop', type: 'numberSubtract', data: { label: 'Negated Drop' } },
    { id: 'bagCenterY', type: 'numberSubtract', data: { label: 'Bag Center Y' } },
    { id: 'bodyTranslateX', type: 'translateX', data: {} },
    { id: 'bodyTranslateY', type: 'translateY', data: {} },
    { id: 'bodyTranslateZ', type: 'translateZ', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'strapWidthIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'strapWidth' },
    { source: 'strapThicknessIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'strapThickness' },
    { source: 'shoulderOffsetIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'shoulderOffset' },
    { source: 'hipOffsetIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'hipOffset' },
    { source: 'dropIn', sourceHandle: 'value', target: 'strapGen', targetHandle: 'drop' },

    { source: 'bagWidthIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'width' },
    { source: 'bagHeightIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'height' },
    { source: 'bagDepthIn', sourceHandle: 'value', target: 'boxGen', targetHandle: 'depth' },

    { source: 'zeroIn', sourceHandle: 'value', target: 'negatedHipOffset', targetHandle: 'a' },
    { source: 'hipOffsetIn', sourceHandle: 'value', target: 'negatedHipOffset', targetHandle: 'b' },

    { source: 'bagHeightIn', sourceHandle: 'value', target: 'halfBagHeight', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'halfBagHeight', targetHandle: 'factor' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'negatedDrop', targetHandle: 'a' },
    { source: 'dropIn', sourceHandle: 'value', target: 'negatedDrop', targetHandle: 'b' },
    { source: 'negatedDrop', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'a' },
    { source: 'halfBagHeight', sourceHandle: 'value', target: 'bagCenterY', targetHandle: 'b' },

    { source: 'boxGen', sourceHandle: 'geometry', target: 'bodyTranslateX', targetHandle: 'geometry' },
    { source: 'negatedHipOffset', sourceHandle: 'value', target: 'bodyTranslateX', targetHandle: 'x' },
    { source: 'bodyTranslateX', sourceHandle: 'geometry', target: 'bodyTranslateY', targetHandle: 'geometry' },
    { source: 'bagCenterY', sourceHandle: 'value', target: 'bodyTranslateY', targetHandle: 'y' },
    { source: 'bodyTranslateY', sourceHandle: 'geometry', target: 'bodyTranslateZ', targetHandle: 'geometry' },
    { source: 'bagFrontDepthIn', sourceHandle: 'value', target: 'bodyTranslateZ', targetHandle: 'z' },

    { source: 'strapGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryA' },
    { source: 'bodyTranslateZ', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryB' },

    { source: 'merge', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
