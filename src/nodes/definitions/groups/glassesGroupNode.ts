import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ブリッジ+左右テンプル(frameGen、`glassesFrameGenerator`)は `alignedBox.ts`(2点間に
 * 整列させる回転+平行移動)を使う処理がまだノード化されていないためコード側に残っているが、
 * 左右のレンズ(トーラス)は `torusGenerator`(汎用プリミティブノード)→`translateX`/
 * `translateZ` というノードグラフへ展開している(`geometry/glasses.ts`/`geometry/CLAUDE.md`
 * 参照)。左レンズは `lensSpacingIn` をそのまま、右レンズは `negatedLensSpacing`
 * (`0 - lensSpacing`)を X座標として使う(旧コードの `leftCenter`/`rightCenter` の式)。
 * Z座標は固定値 `forwardDepthIn`(`geometry/glasses.ts` の `FORWARD_DEPTH` と同じ数値)。
 * トーラスの管の太さ(`tube`)は `frameThicknessHalf`(`frameThickness × 0.5`)として渡す
 * (`zeroIn`/`halfIn`/`forwardDepthIn` は `constNumberInput()` で定義する「常に一定の
 * 値を持つ `numberInput`」)。左右のレンズと frameGen は `mergeGeometry` を2回
 * 経由して1つにまとめる。全パラメータが他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される headCenterY)だけが
 * 唯一の外部ソケット。 */
defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 }],
      },
    },
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045, min: 0.02, max: 0.07, step: 0.005, label: 'Lens Radius' } },
    { id: 'frameThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Frame Thickness' } },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055, min: 0.03, max: 0.09, step: 0.005, label: 'Lens Spacing' } },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01, min: 0.005, max: 0.02, step: 0.001, label: 'Bridge Thickness' } },
    { id: 'templeLengthIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.2, step: 0.01, label: 'Temple Length' } },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006, min: 0.003, max: 0.015, step: 0.001, label: 'Temple Thickness' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#2a2a2a', label: 'Glasses Color' } },
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('halfIn', 0.5, 'Half'),
    constNumberInput('forwardDepthIn', 0.14, 'Forward Depth'),
    { id: 'frameThicknessHalf', type: 'numberMultiply', data: { label: 'Frame Thickness × Half' } },
    { id: 'negatedLensSpacing', type: 'numberSubtract', data: { label: 'Negated Lens Spacing' } },
    { id: 'frameGen', type: 'glassesFrameGenerator', data: {} },
    { id: 'leftTorusGen', type: 'torusGenerator', data: {} },
    { id: 'leftTranslateX', type: 'translateX', data: {} },
    { id: 'leftTranslateZ', type: 'translateZ', data: {} },
    { id: 'rightTorusGen', type: 'torusGenerator', data: {} },
    { id: 'rightTranslateX', type: 'translateX', data: {} },
    { id: 'rightTranslateZ', type: 'translateZ', data: {} },
    { id: 'mergeLenses', type: 'mergeGeometry', data: {} },
    { id: 'mergeAll', type: 'mergeGeometry', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: -0.02, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'frameGen', targetHandle: 'lensRadius' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'frameGen', targetHandle: 'bridgeThickness' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'frameGen', targetHandle: 'lensSpacing' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'frameGen', targetHandle: 'templeLength' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'frameGen', targetHandle: 'templeThickness' },

    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'frameThicknessHalf', targetHandle: 'value' },
    { source: 'halfIn', sourceHandle: 'value', target: 'frameThicknessHalf', targetHandle: 'factor' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'negatedLensSpacing', targetHandle: 'a' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'negatedLensSpacing', targetHandle: 'b' },

    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'leftTorusGen', targetHandle: 'radius' },
    { source: 'frameThicknessHalf', sourceHandle: 'value', target: 'leftTorusGen', targetHandle: 'tube' },
    { source: 'leftTorusGen', sourceHandle: 'geometry', target: 'leftTranslateX', targetHandle: 'geometry' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'leftTranslateX', targetHandle: 'x' },
    { source: 'leftTranslateX', sourceHandle: 'geometry', target: 'leftTranslateZ', targetHandle: 'geometry' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'leftTranslateZ', targetHandle: 'z' },

    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'rightTorusGen', targetHandle: 'radius' },
    { source: 'frameThicknessHalf', sourceHandle: 'value', target: 'rightTorusGen', targetHandle: 'tube' },
    { source: 'rightTorusGen', sourceHandle: 'geometry', target: 'rightTranslateX', targetHandle: 'geometry' },
    { source: 'negatedLensSpacing', sourceHandle: 'value', target: 'rightTranslateX', targetHandle: 'x' },
    { source: 'rightTranslateX', sourceHandle: 'geometry', target: 'rightTranslateZ', targetHandle: 'geometry' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'rightTranslateZ', targetHandle: 'z' },

    { source: 'leftTranslateZ', sourceHandle: 'geometry', target: 'mergeLenses', targetHandle: 'geometryA' },
    { source: 'rightTranslateZ', sourceHandle: 'geometry', target: 'mergeLenses', targetHandle: 'geometryB' },
    { source: 'mergeLenses', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometryA' },
    { source: 'frameGen', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometryB' },

    { source: 'mergeAll', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
