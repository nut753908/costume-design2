import { defineGroupNode } from '../groupNodeFactory';

/** 胴体の形を、幅(X)・前側(+Z)・後ろ側(-Z)の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が胴体の下端(股)で、+Y へ `length + 2 × radius` の高さまで伸びる(カプセルと同じ高さ)。
 *
 * - `xProfile`/`frontProfile`/`backProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径
 *   (`radius` の `r0`〜`r8` 倍、両端 `r0`/`r8` は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を作る。
 *   `xProfile` は左右(X)方向、`frontProfile`/`backProfile` は前側/後ろ側の半径で、腰の丸み・くびれ・胸・
 *   なで肩の形と胴の薄さ、胸・腹と背中の非対称は、この3枚のカードの入力欄の値そのもの。
 * - `gen`(`loftGenerator`)が3本の曲線から、断面が楕円の回転体のような形を1つのジオメトリとして作る。
 *
 * 外部の半径 `radius` に比例するので、体の太さ(Build)を変えると形が相似のまま追従する。 */
defineGroupNode({
  type: 'torsoShape',
  label: 'Torso Shape',
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
    { id: 'radiusDoubled', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'height', type: 'numberAdd', data: {} },

    // 幅(X)方向の半径。値は `radius` に対する比。
    {
      id: 'xProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 1.17, r2: 1.03, r3: 0.9237, r4: 0.835, r5: 0.7903, r6: 0.8154, r7: 0.8939, r8: 0 },
    },
    // 前側(+Z)・後ろ側(-Z)の半径。値は `radius` に対する比(幅のおよそ 0.6〜0.8 倍の薄い胴)。
    // 前後を別々にして、胸・腹の出っ張りと背中の反りの非対称を表す。
    {
      id: 'frontProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6469, r2: 0.6537, r3: 0.6829, r4: 0.6959, r5: 0.6267, r6: 0.4794, r7: 0.257, r8: 0 },
    },
    {
      id: 'backProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.4993, r2: 0.4606, r3: 0.4172, r4: 0.4179, r5: 0.5231, r6: 0.6954, r7: 0.8983, r8: 0 },
    },
    { id: 'gen', type: 'loftGenerator', data: { steps: 48, segments: 64 } },

    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
      },
    },
  ],
  internalEdges: [
    // height = length + radius × 2(カプセルと同じ高さ)
    { source: 'input', sourceHandle: 'radius', target: 'radiusDoubled', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'length', target: 'height', targetHandle: 'a' },
    { source: 'radiusDoubled', sourceHandle: 'value', target: 'height', targetHandle: 'b' },

    { source: 'input', sourceHandle: 'radius', target: 'xProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'xProfile', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'radius', target: 'frontProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'frontProfile', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'radius', target: 'backProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'backProfile', targetHandle: 'length' },

    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'frontProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'backProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'backProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
