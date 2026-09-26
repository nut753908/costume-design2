import { defineGroupNode } from '../groupNodeFactory';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';
import type { GraphEdge } from '../../types';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つ。
 * 3つのパーツ(レンズ・テンプル・ブリッジ)は、それぞれ別のグループノード
 * (`glassesLensPair`/`glassesTemplePair`/`glassesBridge`、`nodes/definitions/generic/`)に
 * 分けて作り、3つの geometry を `mergeAll`(`mergeGeometry`)で結合する。
 * 左右対称のレンズ・テンプルは片側1つ(X=0 基準)を作って `mirrorPair` で ±offset へ複製する
 * (Body の腕/脚と同じ形、各パーツのグループの内部)。
 * 3つのパーツが共有する値(`lensRadiusIn`/`lensSpacingIn`/`forwardDepthCalc`)だけをこのグループに
 * 置いて各パーツへ配線し、1つのパーツだけが使う値(管の太さ、ブリッジ/テンプルの太さなど)は
 * そのパーツのグループの内部に持つ。
 * 顔の前面の深さ `forwardDepthCalc` は、頭半径(`bodyDimensions.headRadius`、bodyGroup の頭と
 * 同じ値)から定数(-0.01、頭の表面より少し前)を引いて求めるため、頭の大きさを変えると追従する。
 * レンズは平面なので、表面ちょうどだと頭の球面が中心寄りでレンズの輪より前に出て、輪の内側が欠ける。
 * 比率ではなく差にしているのは、レンズの大きさ・間隔が固定で、頭の球面とレンズの平面の
 * ずれが頭半径に比例して広がるのを避けるため(比率だと頭が大きいほどレンズが球面に埋まる)。
 * Head Radius と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * headCenterY)は外部ソケット。 */
const output = garmentOutput({ offsetY: -0.02, geometry: 'mergeAll' });

const share = (target: string): GraphEdge[] =>
  ['lensRadiusIn:lensRadius', 'lensSpacingIn:lensSpacing', 'forwardDepthCalc:forwardDepth'].map((pair) => {
    const [source, targetHandle] = pair.split(':');
    return { source, sourceHandle: 'value', target, targetHandle };
  });

defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.28 },
          anchorYSocket,
          colorSocket('#2a2a2a'),
        ],
      },
    },
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.08} },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.1} },
    { id: 'forwardDepthCalc', type: 'numberSubtract', data: { b: -0.01 } },
    { id: 'lens', type: 'glassesLensPair', data: {} },
    { id: 'temple', type: 'glassesTemplePair', data: {} },
    { id: 'bridge', type: 'glassesBridge', data: {} },
    { id: 'mergeAll', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'headRadius', target: 'forwardDepthCalc', targetHandle: 'a' },
    ...share('lens'),
    ...share('temple'),
    ...share('bridge'),
    { source: 'bridge', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'temple', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'lens', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
