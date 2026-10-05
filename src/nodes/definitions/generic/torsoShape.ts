import { defineGroupNode } from '../groupNodeFactory';

/** 胴体の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が胴体の下端(股)で、+Y へ `length + 2 × radius` の高さまで伸びる(カプセルと同じ高さ)。
 *
 * - `xProfile`/`depthProfile`(いずれも `profileCurve17`)と `offsetProfile`(`signedProfileCurve17`)は、高さを
 *   16 等分した 17 点の値(`radius` の `r0`〜`r16` 倍、両端 `r0`/`r16` は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を作る。
 *   胴体は肩・くびれ・腰と細かく形が変わるので 9 点では足りず、17 点にしている。値は探索ではなく、参照を胴体の軸に
 *   垂直な面で切った断面から、幅・前後の厚み・前後のずらしを直接測ったもの(探索で合わせると、点が多い分だけ
 *   値が交互に上下して輪郭が波打つ)。`xProfile` は左右(X)
 *   方向、`depthProfile` は前後(Z)方向の半径で、前後は同じ半径の1つの楕円。
 * - `offsetProfile` は、各高さの輪を前(+Z)へずらす量(`radius` に対する比)。
 *   胸・腹と背中の非対称(胸が前へ出て背が反る形)は、前後別々の半径ではなく、このずらしで表す。前後別々の半径だと
 *   側面でつなぎ目に稜線(エッジ)が立つので、1つの楕円をずらす形にしている。
 *   上端の極(`r16`)も隣(`r15`)と同じ後ろ向きにずらす(0 のままだと、極が軸の中心線に戻って首の後ろの付け根が欠ける)。
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
      type: 'profileCurve17',
      data: { r0: 0, r1: 1.087, r2: 1.058, r3: 1.027, r4: 0.968, r5: 0.8947, r6: 0.8555, r7: 0.7998, r8: 0.7923, r9: 0.7759, r10: 0.8449, r11: 0.8479, r12: 0.8204, r13: 0.9049, r14: 0.9341, r15: 0.8654, r16: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve17',
      data: { r0: 0, r1: 0.4961, r2: 0.5713, r3: 0.5738, r4: 0.5742, r5: 0.5741, r6: 0.5536, r7: 0.572, r8: 0.5725, r9: 0.5868, r10: 0.5876, r11: 0.5874, r12: 0.5774, r13: 0.5594, r14: 0.524, r15: 0.4267, r16: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量。値は `radius` に対する比(負なら後ろへずれる)。上のほうは背中側へずれて、
    // 胸の下の出っ張りから肩甲骨の反りまでを表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0, r1: 0.0334, r2: -0.0005601, r3: 0.03284, r4: 0.06939, r5: 0.1065, r6: 0.1105, r7: 0.1005, r8: 0.06652, r9: 0.02475, r10: -0.02398, r11: -0.1019, r12: -0.1705, r13: -0.23, r14: -0.3009, r15: -0.3643, r16: -0.575 },
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
