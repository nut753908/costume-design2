import { defineGroupNode } from '../groupNodeFactory';

/** 足の形を、幅(X)・足裏側・甲側の3本の輪郭曲線から作る、`bodyGroupNode.ts`(脚の `limbPair` の `foot`)用の
 * グループノード。原点がかかと、+Z へ `length` の高さ(足の長さ)まで伸び、つま先が+Z側になる。
 *
 * `xProfile`/`soleProfile`/`topProfile`(いずれも `profileCurve`)が、足の長さを 8 等分した 9 点の半径
 * (`radius` の `r0`〜`r8` 倍、`r0` がかかとで `r8` がつま先、両端は 0 で丸く閉じる)をなめらかにつなぐ。
 * `soleProfile` は足裏側(-Y)、`topProfile` は甲側(+Y)の高さで、足裏側を小さくすると足裏が平らに近づく
 * (断面は上下で別々の楕円の半分ずつを合わせた形になる、`loftGenerator` の `backProfile` と同じ仕組み)。
 *
 * 輪郭の長さ方向(Y)を `orient`(`rotate`、X に 90 度)で前(+Z)へ倒している: 倒す前の `depthProfile` 側(+Z)が
 * 倒すと下(-Y)、`backProfile` 側(-Z)が上(+Y)になる。 */
defineGroupNode({
  type: 'footShape',
  label: 'Foot Shape',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'length', label: 'Length', type: 'number', default: 0 },
        ],
      },
    },
    // 値はいずれも `radius` に対する比(`r1` がかかと側、`r7` がつま先側)。
    { id: 'xProfile', type: 'profileCurve', data: { r0: 0, r1: 0.1943, r2: 0.558, r3: 0.5332, r4: 0.5913, r5: 0.537, r6: 0.6002, r7: 0.52, r8: 0 } },
    { id: 'soleProfile', type: 'profileCurve', data: { r0: 0, r1: 0.2546, r2: 0.6036, r3: 0.7115, r4: 0.7453, r5: 0.7171, r6: 0.6419, r7: 0.6124, r8: 0 } },
    { id: 'topProfile', type: 'profileCurve', data: { r0: 0, r1: 0.9802, r2: 0.7745, r3: 0.8698, r4: 0.5931, r5: 0.3514, r6: 0.2412, r7: 0.116, r8: 0 } },
    { id: 'gen', type: 'loftGenerator', data: { steps: 32, segments: 32 } },
    { id: 'orient', type: 'rotate', data: { x: 90 } },
    {
      id: 'output',
      type: 'groupOutput',
      data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
    },
  ],
  internalEdges: [
    ...['xProfile', 'soleProfile', 'topProfile'].flatMap((id) => [
      { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
      { source: 'input', sourceHandle: 'length', target: id, targetHandle: 'length' },
    ]),
    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'soleProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'topProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'backProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'orient', targetHandle: 'geometry' },
    { source: 'orient', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
