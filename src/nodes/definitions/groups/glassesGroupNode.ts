import { defineGroupNode } from '../groupNodeFactory';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * ブリッジ+左右テンプル+左右レンズのすべてが完全にノードグラフへ展開されている。
 * ブリッジ・テンプルは `alignedBoxGenerator`(`nodes/definitions/generic/alignedBoxGenerator.ts`、
 * `geometry/alignedBox.ts` の `buildAlignedBox()` を薄くラップした汎用プリミティブノード)で
 * 2点間に整列させて作り、レンズは `torusGenerator`(汎用プリミティブノード)→`translateZ` で
 * 作る(`geometry/CLAUDE.md` 参照)。トーラスの管の太さ(`tube`)は `frameThicknessHalf`
 * (`frameThickness × 0.5`)として渡す(定数は各ノードの入力欄の値)。
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
 * 0.02) - templeLength`(後方)まで伸ばす。ブリッジ・テンプルペア・レンズペアの
 * 3つは `mergeAll`(`mergeGeometry`)で結合する。
 * 顔の前面の深さ `forwardDepthIn` は、頭半径(`bodyDimensions.headRadius`、bodyGroup の頭と
 * 同じ値)から定数(0.02)を引いて求めるため、頭の大きさを変えると追従する。
 * 比率ではなく差にしているのは、レンズの大きさ・間隔が固定で、頭の球面とレンズの平面の
 * ずれが頭半径に比例して広がるのを避けるため(比率だと頭が大きいほどレンズが球面に埋まる)。
 * 複数のノードが同じ値を使うパラメータ(`lensRadiusIn`/`lensSpacingIn`/`bridgeThicknessIn`/
 * `templeThicknessIn`)だけ `numberInput` を置いて配線し、他は numberInput/colorInput ノードを置かず、
 * 各ノードの入力欄の値として持つ。
 * Head Radius と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * headCenterY)は外部ソケット。 */
const output = garmentOutput({ offsetY: -0.02, geometry: 'mergeAll' });

defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses Group',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.16 },
          anchorYSocket,
          colorSocket('#2a2a2a'),
        ],
      },
    },
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045} },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055} },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01} },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006} },
    { id: 'forwardDepthIn', type: 'numberSubtract', data: { b: 0.02 } },
    { id: 'frameThicknessHalf', type: 'numberHalf', data: { value: 0.008 } },

    // ブリッジ(bridgeXOffset の ± を両端の X に)。
    { id: 'bridgeXOffset', type: 'numberSubtract', data: {} },
    { id: 'negatedBridgeXOffset', type: 'numberNegate', data: {} },
    { id: 'bridgeGen', type: 'alignedBoxGenerator', data: {} },

    // テンプル1本(X=0 基準、前面から後方まで Z 方向に伸ばす)を ±templeXOffset へ複製する。
    { id: 'templeXOffset', type: 'numberAdd', data: {} },
    { id: 'templeBackDepth', type: 'numberSubtract', data: { b: 0.02 } },
    { id: 'templeBackZ', type: 'numberSubtract', data: { b: 0.12 } },
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
    { source: 'input', sourceHandle: 'headRadius', target: 'forwardDepthIn', targetHandle: 'a' },

    // ブリッジ = alignedBoxGenerator(± bridgeXOffset、Y=0・Z=forwardDepth は両端で共通)。
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'bridgeXOffset', targetHandle: 'a' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'bridgeXOffset', targetHandle: 'b' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'negatedBridgeXOffset', targetHandle: 'value' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'width' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'thickness' },
    { source: 'bridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startX' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'startZ' },
    { source: 'negatedBridgeXOffset', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endX' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'bridgeGen', targetHandle: 'endZ' },

    // テンプル = alignedBoxGenerator(X=0、前面 forwardDepth から後方 templeBackZ まで Z 方向に
    // 伸ばす)を mirrorPair で ± templeXOffset へ。
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'a' },
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'templeXOffset', targetHandle: 'b' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'templeBackDepth', targetHandle: 'a' },
    { source: 'templeBackDepth', sourceHandle: 'value', target: 'templeBackZ', targetHandle: 'a' },

    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'width' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'thickness' },
    { source: 'forwardDepthIn', sourceHandle: 'value', target: 'templeGen', targetHandle: 'startZ' },
    { source: 'templeBackZ', sourceHandle: 'value', target: 'templeGen', targetHandle: 'endZ' },
    { source: 'templeGen', sourceHandle: 'geometry', target: 'templeMirror', targetHandle: 'geometry' },
    { source: 'templeXOffset', sourceHandle: 'value', target: 'templeMirror', targetHandle: 'offset' },

    // レンズ = torusGenerator(X=0)を translateZ で前面へ置き、mirrorPair で ± lensSpacing へ。
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
