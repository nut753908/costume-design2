import { defineGroupNode } from '../groupNodeFactory';

/** 胴体の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が胴体の下端(股)で、+Y へ `length + 2 × radius` の高さまで伸びる(カプセルと同じ高さ)。
 *
 * - `xProfile`/`depthProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径(`radius` の
 *   `r0`〜`r8` 倍、両端 `r0`/`r8` は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を作る。`xProfile` は左右(X)
 *   方向、`depthProfile` は前後(Z)方向の半径で、前後は同じ半径の1つの楕円。
 * - `offsetProfile`(`signedProfileCurve`、符号付き)は、各高さの輪を前(+Z)へずらす量(`radius` に対する比)。
 *   胸・腹と背中の非対称(胸が前へ出て背が反る形)は、前後別々の半径ではなく、このずらしで表す。前後別々の半径だと
 *   側面でつなぎ目に稜線(エッジ)が立つので、1つの楕円をずらす形にしている。
 * - `gen`(`loftGenerator`)が3本の曲線から、断面が楕円の回転体のような形を1つのジオメトリとして作る。
 *   腰の丸み・くびれ・胸・なで肩の形と胴の薄さは、3枚のカードの入力欄の値そのもの。
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

    // 幅(X)方向と前後(Z)方向の半径。値は `radius` に対する比(前後は幅のおよそ 0.5〜0.6 倍の薄い胴)。
    {
      id: 'xProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 1.1533, r2: 0.9688, r3: 0.8661, r4: 0.7989, r5: 0.7562, r6: 0.7132, r7: 0.9769, r8: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6128, r2: 0.5839, r3: 0.574, r4: 0.5728, r5: 0.5915, r6: 0.5741, r7: 0.5239, r8: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量。値は `radius` に対する比(負なら後ろへずれる)。上のほうは背中側へずれて、
    // 胸の下の出っ張りから肩甲骨の反りまでを表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve',
      data: { r0: 0, r1: 0.036, r2: 0.09, r3: 0.1075, r4: 0.0804, r5: -0.0428, r6: -0.1652, r7: -0.3453, r8: 0 },
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
    { source: 'input', sourceHandle: 'radius', target: 'depthProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'depthProfile', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'radius', target: 'offsetProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'offsetProfile', targetHandle: 'length' },

    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
