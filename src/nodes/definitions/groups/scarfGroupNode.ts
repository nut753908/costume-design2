import { defineGroupNode } from '../groupNodeFactory';

/** scarf(マフラー)は、他のガーメントのように専用の `build*Geometry()` 関数を一切持たず、
 * 既存の汎用ノードだけを組み合わせて完全にノードグラフ上で表現されている。首元の輪
 * (`band`)は既存の `beltGenerator` ノードを `bulge=1.05` 固定でそのままネストして再利用し
 * (`geometry/CLAUDE.md` 参照)、タイ(`tail`、`boxGenerator`)は `translateY`/`translateZ`
 * で配置する。Y座標(`tailCenterY = (0 - bandThickness) - tailLength × 0.5`)/Z座標
 * (`tailCenterZ = neckRadius(スケール後) × tailFrontInsetIn`、固定値0.9)はどちらも可視の
 * 四則演算チェーンで導出する(`zeroIn`/`halfIn` は `bodyLayoutGroupNode.ts` の
 * `halfIn`/`feetYIn` と同じ「常に一定の値を持つ `numberInput`」のイディオム)。`band`/`tail`
 * は最後に `mergeGeometry` で1つにまとめる。
 *
 * Neck Radius/Band Thickness/Tail Width/Tail Length/Segments/Color は他のガーメントと
 * 共有されない単独パラメータのため、外側の numberInput/colorInput ノードではなくグループ
 * 内部の同型ノードとして保持する。Body Build(半径スケーリング用)と Anchor Y(取り付け位置、
 * ルートの `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。 */
defineGroupNode({
  type: 'scarfGroup',
  label: 'Scarf',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'neckRadiusIn', type: 'numberInput', data: { value: 0.19, min: 0.14, max: 0.3, step: 0.005, label: 'Neck Radius' } },
    { id: 'bandThicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.1, step: 0.005, label: 'Band Thickness' } },
    { id: 'tailWidthIn', type: 'numberInput', data: { value: 0.09, min: 0.04, max: 0.16, step: 0.005, label: 'Tail Width' } },
    { id: 'tailLengthIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.7, step: 0.01, label: 'Tail Length' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a2e3a', label: 'Scarf Color' } },
    { id: 'zeroIn', type: 'numberInput', data: { value: 0, min: 0, max: 0, step: 0.01, label: 'Zero' } },
    { id: 'halfIn', type: 'numberInput', data: { value: 0.5, min: 0.5, max: 0.5, step: 0.01, label: 'Half' } },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.05, min: 1.05, max: 1.05, step: 0.01, label: 'Band Bulge' } },
    { id: 'tailFrontInsetIn', type: 'numberInput', data: { value: 0.9, min: 0.9, max: 0.9, step: 0.01, label: 'Tail Front Inset' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'bandGen', type: 'beltGenerator', data: {} },
    { id: 'tailGen', type: 'boxGenerator', data: {} },
    { id: 'negatedBandThickness', type: 'numberSubtract', data: { label: 'Negated Band Thickness' } },
    { id: 'halfTailLength', type: 'numberMultiply', data: { label: 'Tail Length × Half' } },
    { id: 'tailCenterY', type: 'numberSubtract', data: { label: 'Tail Center Y' } },
    { id: 'tailCenterZ', type: 'numberMultiply', data: { label: 'Tail Center Z' } },
    { id: 'tailTranslateY', type: 'translateY', data: {} },
    { id: 'tailTranslateZ', type: 'translateZ', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0.08, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'neckRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },

    { source: 'scale', sourceHandle: 'value', target: 'bandGen', targetHandle: 'radius' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'bandGen', targetHandle: 'thickness' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'bandGen', targetHandle: 'bulge' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'bandGen', targetHandle: 'segments' },

    { source: 'tailWidthIn', sourceHandle: 'value', target: 'tailGen', targetHandle: 'width' },
    { source: 'tailLengthIn', sourceHandle: 'value', target: 'tailGen', targetHandle: 'height' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'tailGen', targetHandle: 'depth' },

    { source: 'zeroIn', sourceHandle: 'value', target: 'negatedBandThickness', targetHandle: 'a' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'negatedBandThickness', targetHandle: 'b' },
    { source: 'tailLengthIn', sourceHandle: 'value', target: 'halfTailLength', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'halfTailLength', targetHandle: 'factor' },
    { source: 'negatedBandThickness', sourceHandle: 'value', target: 'tailCenterY', targetHandle: 'a' },
    { source: 'halfTailLength', sourceHandle: 'value', target: 'tailCenterY', targetHandle: 'b' },

    { source: 'scale', sourceHandle: 'value', target: 'tailCenterZ', targetHandle: 'value' },
    { source: 'tailFrontInsetIn', sourceHandle: 'value', target: 'tailCenterZ', targetHandle: 'factor' },

    { source: 'tailGen', sourceHandle: 'geometry', target: 'tailTranslateY', targetHandle: 'geometry' },
    { source: 'tailCenterY', sourceHandle: 'value', target: 'tailTranslateY', targetHandle: 'y' },
    { source: 'tailTranslateY', sourceHandle: 'geometry', target: 'tailTranslateZ', targetHandle: 'geometry' },
    { source: 'tailCenterZ', sourceHandle: 'value', target: 'tailTranslateZ', targetHandle: 'z' },

    { source: 'bandGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryA' },
    { source: 'tailTranslateZ', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometryB' },

    { source: 'merge', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
