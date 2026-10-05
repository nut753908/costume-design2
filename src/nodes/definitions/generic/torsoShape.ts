import { defineGroupNode } from '../groupNodeFactory';

/** 胴体と首を1本の連続した輪郭で作る(胴体の延長が首)、`bodyGroupNode.ts` 用のグループノード。幅(X)・前後の厚み(Z)・
 * 前後のずらし量の3本の輪郭曲線から作る。原点が胴体の下端(股)で、+Y へ `length + 2 × radius + extra` の高さまで
 * 伸びる(`length + 2 × radius` はカプセルと同じ高さで、肩の上端まで。`extra` は首の分の延長で、先端は頭の中に埋まる)。
 *
 * - `xProfile`/`depthProfile`(いずれも `profileCurve25`)と `offsetProfile`(`signedProfileCurve25`)は、高さを
 *   24 等分した 25 点の値(`radius` の `r0`〜`r24` 倍、両端 `r0`/`r24` の半径は 0 で丸く閉じる)をなめらかにつないだ輪郭曲線を
 *   作る。胴体は肩・くびれ・腰と細かく形が変わり、首までつなぐので、25 点にしている。値は探索ではなく、参照を胴体の軸に
 *   垂直な面で切った断面から、幅・前後の厚み・前後のずらしを直接測ったもの(探索で合わせると、点が多い分だけ値が交互に
 *   上下して輪郭が波打つ)。頭と融合して測れない首の先端の2点(`r22`/`r23`)だけは、首の太さに合わせた仮の値。
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
      type: 'profileCurve25',
      data: { r0: 0, r1: 1.1501, r2: 1.1046, r3: 1.0801, r4: 1.0483, r5: 0.9992, r6: 0.9348, r7: 0.8883, r8: 0.8487, r9: 0.8097, r10: 0.7958, r11: 0.7719, r12: 0.7648, r13: 0.8665, r14: 0.8546, r15: 0.8202, r16: 0.9906, r17: 0.9691, r18: 0.9516, r19: 0.8713, r20: 0.5852, r21: 0.3324, r22: 0.31, r23: 0.36, r24: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve25',
      data: { r0: 0, r1: 0.5075, r2: 0.5677, r3: 0.5872, r4: 0.5767, r5: 0.5743, r6: 0.5741, r7: 0.5691, r8: 0.5573, r9: 0.5714, r10: 0.5705, r11: 0.5865, r12: 0.5959, r13: 0.5871, r14: 0.5875, r15: 0.5825, r16: 0.5681, r17: 0.5521, r18: 0.5071, r19: 0.4299, r20: 0.3768, r21: 0.3292, r22: 0.38, r23: 0.345, r24: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量。値は `radius` に対する比(負なら後ろへずれる)。上のほうは背中側へずれて、
    // 胸の下の出っ張りから肩甲骨の反りまでを表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve25',
      data: { r0: 0, r1: 0.0523, r2: 0.0169, r3: 0.0222, r4: 0.0411, r5: 0.0671, r6: 0.0962, r7: 0.1203, r8: 0.0998, r9: 0.1, r10: 0.0688, r11: 0.0458, r12: 0.0042, r13: -0.0414, r14: -0.1037, r15: -0.1604, r16: -0.2083, r17: -0.253, r18: -0.3139, r19: -0.3628, r20: -0.3639, r21: -0.2876, r22: -0.18, r23: -0.11, r24: -0.53 },
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
