import { defineGroupNode } from '../groupNodeFactory';

/** 胴体と首を1本の連続した輪郭で作る(胴体の延長が首)、`bodyGroupNode.ts` 用のグループノード。幅(X)・前後の厚み(Z)・
 * 前後のずらし量の3本の輪郭曲線から作る。原点が胴体の下端(股)で、+Y へ `length + 2 × radius + extra` の高さまで
 * 伸びる(`length + 2 × radius` はカプセルと同じ高さで、肩の上端まで。`extra` は首の分の延長で、先端は頭の中に埋まる)。
 *
 * - `xProfile`/`depthProfile`(いずれも `profileCurve33`)と `offsetProfile`(`signedProfileCurve33`)は、高さを
 *   32 等分した 33 点の値(`radius` の `r0`〜`r32` 倍、両端 `r0`/`r32` の半径は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を
 *   作る。胴体は肩・くびれ・腰と細かく形が変わり、首までつなぐので、33 点にしている。値は探索ではなく、参照を胴体の軸に
 *   垂直な面で切った断面から、幅・前後の厚み・前後のずらしを直接測ったもの(探索で合わせると、点が多い分だけ値が交互に
 *   上下して輪郭が波打つ)。頭と融合して測れない首の先端の3点(`r30`/`r31`)と極(`r32`)だけは、首の太さに合わせた仮の値。
 *   `xProfile` は左右(X)方向、`depthProfile` は前後(Z)方向の半径で、前後は同じ半径の1つの楕円。
 * - `offsetProfile` は、各高さの輪を前(+Z)へずらす量(`radius` に対する比)。
 *   胸・腹と背中の非対称(胸が前へ出て背が反る形)と、首が胴体より前へ傾く曲がりは、前後別々の半径ではなく、このずらし
 *   で表す(前後別々の半径だと側面でつなぎ目に稜線(エッジ)が立つので、1つの楕円をずらす形にしている)。
 * - `gen`(`loftGenerator`)が3本の曲線から、断面が楕円の回転体のような形を1つのジオメトリとして作る。
 *   腰の丸み・くびれ・胸・なで肩・首の形と胴の薄さは、3枚のカードの入力欄の値そのもの。
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
          { id: 'extra', label: 'Extra Length', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'radiusDoubled', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'heightBase', type: 'numberAdd', data: {} },
    { id: 'height', type: 'numberAdd', data: {} },

    // 幅(X)方向と前後(Z)方向の半径。値は `radius` に対する比(前後は幅のおよそ 0.5〜0.6 倍の薄い胴)。
    {
      id: 'xProfile',
      type: 'profileCurve33',
      data: { r0: 0, r1: 1.1527, r2: 1.134, r3: 1.0954, r4: 1.0801, r5: 1.0584, r6: 1.0272, r7: 0.9821, r8: 0.9348, r9: 0.8977, r10: 0.873, r11: 0.8341, r12: 0.8097, r13: 0.8009, r14: 0.7848, r15: 0.7703, r16: 0.7638, r17: 0.8568, r18: 0.8735, r19: 0.848, r20: 0.8202, r21: 0.9988, r22: 0.9806, r23: 0.9622, r24: 0.9516, r25: 0.9074, r26: 0.7593, r27: 0.5025, r28: 0.3324, r29: 0.2963, r30: 0.3488, r31: 0.3418, r32: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve33',
      data: { r0: 0, r1: 0.5003, r2: 0.5291, r3: 0.5803, r4: 0.5872, r5: 0.5794, r6: 0.5743, r7: 0.5743, r8: 0.5741, r9: 0.5725, r10: 0.5566, r11: 0.5645, r12: 0.5714, r13: 0.5672, r14: 0.5783, r15: 0.5867, r16: 0.5959, r17: 0.5874, r18: 0.5861, r19: 0.5865, r20: 0.5825, r21: 0.5697, r22: 0.5598, r23: 0.5507, r24: 0.5071, r25: 0.4456, r26: 0.4041, r27: 0.3608, r28: 0.3292, r29: 0.3559, r30: 0.4194, r31: 0.3128, r32: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量。値は `radius` に対する比(負なら後ろへずれる)。上のほうは背中側へずれて、
    // 胸の下の出っ張りから肩甲骨の反りまでを表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0, r1: 0.0553, r2: 0.0431, r3: 0.0117, r4: 0.0222, r5: 0.0366, r6: 0.0529, r7: 0.0744, r8: 0.0962, r9: 0.1166, r10: 0.1143, r11: 0.0954, r12: 0.1, r13: 0.0742, r14: 0.0642, r15: 0.0329, r16: 0.0042, r17: -0.0267, r18: -0.0722, r19: -0.1188, r20: -0.1604, r21: -0.1935, r22: -0.2294, r23: -0.2678, r24: -0.3139, r25: -0.3547, r26: -0.371, r27: -0.3502, r28: -0.2876, r29: -0.1994, r30: -0.0881, r31: -0.1581, r32: -0.53 },
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
    // height = length + radius × 2(カプセルと同じ高さ) + extra(首の分の延長)
    { source: 'input', sourceHandle: 'radius', target: 'radiusDoubled', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'length', target: 'heightBase', targetHandle: 'a' },
    { source: 'radiusDoubled', sourceHandle: 'value', target: 'heightBase', targetHandle: 'b' },
    { source: 'heightBase', sourceHandle: 'value', target: 'height', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'extra', target: 'height', targetHandle: 'b' },

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
