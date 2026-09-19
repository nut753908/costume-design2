import { defineGroupNode } from '../groupNodeFactory';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { constNumberInput } from '../constNumberInput';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ブリッジ+左右テンプル+左右レンズのすべてが完全にノードグラフへ展開されている。
 * ブリッジ・テンプルは `alignedBoxGenerator`(`nodes/definitions/generic/alignedBoxGenerator.ts`、
 * `geometry/alignedBox.ts` の `buildAlignedBox()` を薄くラップした汎用プリミティブノード)で
 * 2点間に整列させて作り、レンズは `torusGenerator`(汎用プリミティブノード)→`translateZ` で
 * 作る(`geometry/CLAUDE.md` 参照)。トーラスの管の太さ(`tube`)は `frameThicknessHalf`
 * (`frameThickness × 0.5`)として渡す(`zeroIn`/`forwardDepthIn`/`templeBackOffsetIn` は
 * `constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」)。
 *
 * 左右対称なレンズ・テンプルは、片側1つ(X=0 基準)だけを作って `mirrorPair`
 * (`nodes/definitions/generic/mirrorPair.ts`)で ±offset へ複製する(Body の腕/脚と同じ形)。
 * レンズの offset は `lensSpacingIn`、テンプルの offset は
 * `templeXOffset = lensSpacing + lensRadius`。Z座標は固定値 `forwardDepthIn`(ブリッジ/
 * テンプルの前面側 `startZ` とも共有する)。
 *
 * ブリッジは1本の箱で、`bridgeXOffset = lensSpacing - lensRadius` の ± を両端(`endX` は
 * `negatedBridgeXOffset`、`numberNegate`)に置き、Y=0・Z=`forwardDepthIn` は両端で共通。
 * テンプルは Z だけ `forwardDepthIn`(前面)から `templeBackZ = (forwardDepthIn -
 * templeBackOffsetIn) - templeLength`(後方)まで伸ばす。ブリッジ・テンプルペア・レンズペアの
 * 3つは `mergeAll`(`mergeGeometry`)で結合する。
 * 顔の前面の深さ `forwardDepthIn` は、頭半径(`bodyDimensions.headRadius`、bodyGroup の頭と
 * 同じ値)に `forwardDepthRatioIn` を掛けて求めるため、頭の大きさを変えると追従する。
 * レンズの大きさ・間隔などそれ以外のパラメータは他のガーメントと共有されない単独パラメータの
 * ため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Head Radius と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * headCenterY)は外部ソケット。 */
const output = garmentOutput({ color: { hex: '#2a2a2a', label: 'Glasses Color' }, offsetY: -0.02, geometry: 'mergeAll' });

defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.16 },
          anchorYSocket,
        ],
      },
    },
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045, min: 0.02, max: 0.07, step: 0.005, label: 'Lens Radius' } },
    { id: 'frameThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Frame Thickness' } },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055, min: 0.03, max: 0.09, step: 0.005, label: 'Lens Spacing' } },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01, min: 0.005, max: 0.02, step: 0.001, label: 'Bridge Thickness' } },
    { id: 'templeLengthIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.2, step: 0.01, label: 'Temple Length' } },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006, min: 0.003, max: 0.015, step: 0.001, label: 'Temple Thickness' } },
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('forwardDepthRatioIn', 0.875, 'Forward Depth Ratio'),
    { id: 'forwardDepthIn', type: 'numberMultiply', data: { label: 'Forward Depth' } },
    constNumberInput('templeBackOffsetIn', 0.02, 'Temple Back Offset'),
    { id: 'frameThicknessHalf', type: 'numberHalf', data: { label: 'Frame Thickness × Half' } },

    // ブリッジ(bridgeXOffset の ± を両端の X に)。
    { id: 'bridgeXOffset', type: 'numberSubtract', data: { label: 'Lens Spacing − Lens Radius' } },
    { id: 'negatedBridgeXOffset', type: 'numberNegate', data: { label: 'Negated Bridge X Offset' } },
    { id: 'bridgeGen', type: 'alignedBoxGenerator', data: {} },

    // テンプル1本(X=0 基準、前面から後方まで Z 方向に伸ばす)を ±templeXOffset へ複製する。
    { id: 'templeXOffset', type: 'numberAdd', data: { label: 'Lens Spacing + Lens Radius' } },
    { id: 'templeBackDepth', type: 'numberSubtract', data: { label: 'Temple Back Depth' } },
    { id: 'templeBackZ', type: 'numberSubtract', data: { label: 'Temple Back Z' } },
    { id: 'templeGen', type: 'alignedBoxGenerator', data: {} },
    { id: 'templeMirror', type: 'mirrorPair', data: {} },

    // レンズ1つ(X=0 基準)を ±lensSpacing へ複製する。
    { id: 'lensGen', type: 'torusGenerator', data: {} },
    { id: 'lensTranslateZ', type: 'translateZ', data: {} },
    { id: 'lensMirror', type: 'mirrorPair', data: {} },
    { id: 'mergeAll', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'headRadius', target: 'forwardDepthIn', targetHandle: 'value' },
    { source: 'forwardDepthRatioIn', sourceHandle: 'value', target: 'forwardDepthIn', targetHandle: 'factor' },

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

    // テンプル = alignedBoxGenerator(X=0、前面 forwardDepth から後方 templeBackZ まで Z 方向に
    // 伸ばす)を mirrorPair で ± templeXOffset へ。
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'a' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'b' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'templeBackDepth', targetHandle: 'a' },
    { source: 'templeBackOffsetIn', sourceHandle: 'value', target: 'templeBackDepth', targetHandle: 'b' },
    { source: 'templeBackDepth', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'a' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'b' },

    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'width' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'thickness' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'startX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'startY' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'startZ' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'endX' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'endY' },
    { source: 'templeBackZ', sourceHandle: 'value', target: 'templeGen', targetHandle: 'endZ' },
    { source: 'templeGen', sourceHandle: 'geometry', target: 'templeMirror', targetHandle: 'geometry' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'templeMirror', targetHandle: 'offset' },

    // レンズ = torusGenerator(X=0)を translateZ で前面へ置き、mirrorPair で ± lensSpacing へ。
    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'frameThicknessHalf', targetHandle: 'value' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'lensGen', targetHandle: 'radius' },
    { source: 'frameThicknessHalf', sourceHandle: 'value', target: 'lensGen', targetHandle: 'tube' },
    { source: 'lensGen', sourceHandle: 'geometry', target: 'lensTranslateZ', targetHandle: 'geometry' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'lensTranslateZ', targetHandle: 'z' },
    { source: 'lensTranslateZ', sourceHandle: 'geometry', target: 'lensMirror', targetHandle: 'geometry' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'lensMirror', targetHandle: 'offset' },

    { source: 'bridgeGen', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'templeMirror', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'lensMirror', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
