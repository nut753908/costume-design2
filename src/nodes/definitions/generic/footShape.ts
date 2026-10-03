import { defineGroupNode } from '../groupNodeFactory';

/** 足の形を、幅(X)・厚み(足裏〜甲)・足裏方向へのずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts`(脚の `limbPair` の `foot`)用の
 * グループノード。原点がかかと、+Z へ `length` の高さ(足の長さ)まで伸び、つま先が+Z側になる。
 *
 * `xProfile`/`depthProfile`(いずれも `profileCurve`)が、足の長さを 8 等分した 9 点の半径(`radius` の
 * `r0`〜`r8` 倍、`r0` がかかとで `r8` がつま先、両端は 0 で丸く閉じる)をなめらかにつなぐ。`depthProfile` は
 * 足の厚み(上下)の半径で、断面は1つの楕円。`offsetProfile`(`signedProfileCurve`、符号付き)は各断面を足裏側へ
 * ずらす量(`radius` に対する比)で、足裏が平らで甲が盛り上がる非対称は、このずらしで表す(足裏側と甲側を別々の
 * 半径にすると、側面でつなぎ目に稜線が立つ)。
 *
 * 輪郭の長さ方向(Y)を `orient`(`rotate`、X に 90 度)で前(+Z)へ倒している: 倒す前の +Z 側が倒すと下(-Y)、
 * -Z 側が上(+Y)になるので、`offsetProfile` の正の値は足裏側(下)へのずらし。 */
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
    { id: 'xProfile', type: 'profileCurve', data: { r0: 0, r1: 0.1943, r2: 0.5544, r3: 0.5546, r4: 0.5913, r5: 0.58, r6: 0.5301, r7: 0.5616, r8: 0 } },
    { id: 'depthProfile', type: 'profileCurve', data: { r0: 0, r1: 0.6668, r2: 0.689, r3: 0.7906, r4: 0.6692, r5: 0.5343, r6: 0.4415, r7: 0.3642, r8: 0 } },
    { id: 'offsetProfile', type: 'signedProfileCurve', data: { r0: 0, r1: -0.3338, r2: -0.09228, r3: -0.07915, r4: 0.0761, r5: 0.1975, r6: 0.2029, r7: 0.2375, r8: 0 } },
    { id: 'gen', type: 'loftGenerator', data: { steps: 32, segments: 32 } },
    { id: 'orient', type: 'rotate', data: { x: 90 } },
    {
      id: 'output',
      type: 'groupOutput',
      data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
    },
  ],
  internalEdges: [
    ...['xProfile', 'depthProfile', 'offsetProfile'].flatMap((id) => [
      { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
      { source: 'input', sourceHandle: 'length', target: id, targetHandle: 'length' },
    ]),
    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'orient', targetHandle: 'geometry' },
    { source: 'orient', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
