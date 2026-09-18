import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ブリッジ+左右テンプルのどちらも完全にノードグラフへ展開されている。3つとも
 * `alignedBoxGenerator`(`nodes/definitions/generic/alignedBoxGenerator.ts`、`geometry/
 * alignedBox.ts` の `buildAlignedBox()` を薄くラップした汎用プリミティブノード)で2点間に
 * 整列させて作り、左右のレンズ(トーラス)は `torusGenerator`(汎用プリミティブノード)→
 * `translateX`/`translateZ` というノードグラフへ展開している(`geometry/CLAUDE.md` 参照)。
 * 左レンズは `lensSpacingIn` をそのまま、右レンズは `negatedLensSpacing`
 * (`numberNegate`)を X座標として使う。Z座標は固定値 `forwardDepthIn`(ブリッジ/テンプルの
 * 前面側 `startZ` とも共有する)。
 * トーラスの管の太さ(`tube`)は `frameThicknessHalf`(`frameThickness × 0.5`)として渡す
 * (`zeroIn`/`forwardDepthIn`/`templeBackOffsetIn` は `constNumberInput()` で
 * 定義する「常に一定の値を持つ `numberInput`」)。
 *
 * ブリッジは `bridgeXOffset = lensSpacing - lensRadius` の ± を両端(`endX` は
 * `negatedBridgeXOffset`、`numberNegate`)に置き、Y=0・Z=`forwardDepthIn` は
 * 両端で共通。左右テンプルは `templeXOffset = lensSpacing + lensRadius`(右は
 * `negatedTempleXOffset`、同じく `numberNegate`)を X として使い、Z だけ `forwardDepthIn`
 * (前面)から `templeBackZ = (forwardDepthIn - templeBackOffsetIn) - templeLength`
 * (後方、旧コードの `TEMPLE_BACK_DEPTH - templeLength`)まで伸ばす(旧コードの
 * `bridgeStart`/`bridgeEnd`/`leftTempleStart`/`leftTempleEnd`/`rightTempleStart`/
 * `rightTempleEnd` の式)。ブリッジ・左テンプル・右テンプルは `mergeGeometry` を2回
 * 経由してフレーム1つにまとめ、左右のレンズと合わせてさらに `mergeGeometry` で結合する。
 * 全パラメータが他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
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
    constNumberInput('forwardDepthIn', 0.14, 'Forward Depth'),
    constNumberInput('templeBackOffsetIn', 0.02, 'Temple Back Offset'),
    { id: 'frameThicknessHalf', type: 'numberHalf', data: { label: 'Frame Thickness × Half' } },
    { id: 'negatedLensSpacing', type: 'numberNegate', data: { label: 'Negated Lens Spacing' } },

    // ブリッジ(bridgeXOffset の ± を両端の X に)。
    { id: 'bridgeXOffset', type: 'numberSubtract', data: { label: 'Lens Spacing − Lens Radius' } },
    { id: 'negatedBridgeXOffset', type: 'numberNegate', data: { label: 'Negated Bridge X Offset' } },
    { id: 'bridgeGen', type: 'alignedBoxGenerator', data: {} },

    // 左右テンプル(templeXOffset の ± を X に、前面から後方まで Z 方向に伸ばす)。
    { id: 'templeXOffset', type: 'numberAdd', data: { label: 'Lens Spacing + Lens Radius' } },
    { id: 'negatedTempleXOffset', type: 'numberNegate', data: { label: 'Negated Temple X Offset' } },
    { id: 'templeBackDepth', type: 'numberSubtract', data: { label: 'Temple Back Depth' } },
    { id: 'templeBackZ', type: 'numberSubtract', data: { label: 'Temple Back Z' } },
    { id: 'leftTempleGen', type: 'alignedBoxGenerator', data: {} },
    { id: 'rightTempleGen', type: 'alignedBoxGenerator', data: {} },
    { id: 'mergeBridgeLeft', type: 'mergeGeometry', data: {} },
    { id: 'mergeFrame', type: 'mergeGeometry', data: {} },

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
    // ブリッジ = alignedBoxGenerator(± bridgeXOffset、Y=0・Z=forwardDepth は両端で共通)。
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'bridgeXOffset', targetHandle: 'a' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'bridgeXOffset', targetHandle: 'b' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'negatedBridgeXOffset', targetHandle: 'value' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'width' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'thickness' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startY' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startZ' },
    { source: 'negatedBridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endY' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endZ' },

    // 左右テンプル = alignedBoxGenerator(± templeXOffset、前面 forwardDepth から
    // 後方 templeBackZ まで Z 方向に伸ばす)。
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'a' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'b' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'negatedTempleXOffset', targetHandle: 'value' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'templeBackDepth', targetHandle: 'a' },
    { source: 'templeBackOffsetIn', sourceHandle: 'value', target: 'templeBackDepth', targetHandle: 'b' },
    { source: 'templeBackDepth', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'a' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'b' },

    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'width' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'thickness' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'startY' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'startZ' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'endX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'endY' },
    { source: 'templeBackZ', sourceHandle: 'value', target: 'leftTempleGen', targetHandle: 'endZ' },

    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'width' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'thickness' },
    { source: 'negatedTempleXOffset', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'startY' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'startZ' },
    { source: 'negatedTempleXOffset', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'endX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'endY' },
    { source: 'templeBackZ', sourceHandle: 'value', target: 'rightTempleGen', targetHandle: 'endZ' },

    { source: 'bridgeGen', sourceHandle: 'geometry', target: 'mergeBridgeLeft', targetHandle: 'geometryA' },
    { source: 'leftTempleGen', sourceHandle: 'geometry', target: 'mergeBridgeLeft', targetHandle: 'geometryB' },
    { source: 'mergeBridgeLeft', sourceHandle: 'geometry', target: 'mergeFrame', targetHandle: 'geometryA' },
    { source: 'rightTempleGen', sourceHandle: 'geometry', target: 'mergeFrame', targetHandle: 'geometryB' },

    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'frameThicknessHalf', targetHandle: 'value' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'negatedLensSpacing', targetHandle: 'value' },

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
    { source: 'mergeFrame', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometryB' },

    { source: 'mergeAll', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
