import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';
import type { GraphEdge } from '../../types';

/** glasses は独立したスタイル寄りの寸法のみを持つ。
 * 3つのパーツ(レンズ・テンプル・ブリッジ)は、それぞれ別のグループノード
 * (`glassesLensPair`/`glassesTemplePair`/`glassesBridge`、`nodes/definitions/generic/`)に
 * 分けて作り、3つの geometry を `mergeAll`(`mergeGeometry`)で結合する。
 * 左右対称のレンズ・テンプルは片側1つ(X=0 基準)を作って `mirrorPair` で ±offset へ複製する
 * (Body の腕/脚と同じ形、各パーツのグループの内部)。
 * 3つのパーツが共有する値(`lensRadiusIn`/`lensSpacingIn`/`forwardDepthCalc`)だけをこのグループに
 * 置いて各パーツへ配線し、1つのパーツだけが使う値(管の太さ、ブリッジ/テンプルの太さなど)は
 * そのパーツのグループの内部に持つ。
 * 顔の前面の深さ `forwardDepthCalc` は、頭の表面より少し前(0.3066)に置く固定値。
 * レンズは平面なので、表面ちょうどだと頭の球面が中心寄りでレンズの輪より前に出て、輪の内側が欠ける。 */
const output = garmentOutput({ y: 1.55, geometry: 'mergeAll' });

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
          colorSocket('#2a2a2a'),
        ],
      },
    },
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.08} },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.1} },
    { id: 'forwardDepthCalc', type: 'numberInput', data: { value: 0.3066 } },
    { id: 'lens', type: 'glassesLensPair', data: {} },
    { id: 'temple', type: 'glassesTemplePair', data: {} },
    { id: 'bridge', type: 'glassesBridge', data: {} },
    { id: 'mergeAll', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...share('lens'),
    ...share('temple'),
    ...share('bridge'),
    { source: 'bridge', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'temple', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    { source: 'lens', sourceHandle: 'geometry', target: 'mergeAll', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
