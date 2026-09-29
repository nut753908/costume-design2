import { defineGroupNode } from '../groupNodeFactory';

/** 胴体の形を、幅(X)と奥行き(Z)の2本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が胴体の下端(股)で、+Y へ `length + 2 × radius` の高さまで伸びる(カプセルと同じ高さ)。
 *
 * - `xProfile`/`zProfile`(どちらも `profileCurve`)が、高さを 8 等分した 9 点の半径
 *   (`radius` の `r0`〜`r8` 倍、両端 `r0`/`r8` は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を作る。
 *   `xProfile` は左右(X)方向の半径、`zProfile` は前後(Z)方向の半径で、腰の丸み・くびれ・胸・なで肩の
 *   形と胴の薄さは、この2枚のカードの入力欄の値そのもの。
 * - `gen`(`loftGenerator`)が2本の曲線から、断面が楕円の回転体のような形を1つのジオメトリとして作る。
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
      data: { r0: 0, r1: 1.031, r2: 0.9993, r3: 0.9697, r4: 0.9421, r5: 0.9175, r6: 0.8932, r7: 0.8676, r8: 0 },
    },
    // 前後(Z)方向の半径。値は `radius` に対する比(幅のおよそ 0.6〜0.8 倍の薄い胴)。
    {
      id: 'zProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.7195, r2: 0.682, r3: 0.6404, r4: 0.5869, r5: 0.543, r6: 0.5167, r7: 0.5, r8: 0 },
    },
    { id: 'gen', type: 'loftGenerator', data: { steps: 24, segments: 24 } },

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
    { source: 'input', sourceHandle: 'radius', target: 'zProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'zProfile', targetHandle: 'length' },

    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'zProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
