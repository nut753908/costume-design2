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
 * - `tiltProfile`(`signedProfileCurve33`、値は度数)は、各高さの輪を前へ傾ける角度。胴体は 0 で、首のあたり(`r26`〜)で約20°
 *   まで増える。首は胴体より約25°前へ傾いており、輪を首の軸に垂直にすると、首の後ろ側の縁が頭の下面まで届く。
 * - `gen`(`loftGenerator`)が3本の曲線から、断面が楕円の回転体のような形を1つのジオメトリとして作る。
 *   腰の丸み・くびれ・胸・なで肩・首の形と胴の薄さは、3枚のカードの入力欄の値そのもの。
 *
 * 外部の半径 `radius` に比例するので、`torsoRadius` を変えると形が相似のまま追従する。 */
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
      data: { r0: 0, r1: 1.0725, r2: 1.0904, r3: 1.0533, r4: 1.0776, r5: 1.0527, r6: 1.0187, r7: 0.9671, r8: 0.9222, r9: 0.8876, r10: 0.8608, r11: 0.8204, r12: 0.8052, r13: 0.7934, r14: 0.7734, r15: 0.7598, r16: 0.8251, r17: 0.8763, r18: 0.8525, r19: 0.8146, r20: 1.0045, r21: 0.9823, r22: 0.9643, r23: 0.9531, r24: 0.9099, r25: 0.759, r26: 0.4832, r27: 0.3216, r28: 0.303, r29: 0.34, r30: 0.38, r31: 0.33, r32: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve33',
      data: { r0: 0, r1: 0.5011, r2: 0.5334, r3: 0.5825, r4: 0.5861, r5: 0.5777, r6: 0.5743, r7: 0.5743, r8: 0.5741, r9: 0.5687, r10: 0.5532, r11: 0.57, r12: 0.5683, r13: 0.5722, r14: 0.5861, r15: 0.5927, r16: 0.5909, r17: 0.5869, r18: 0.5874, r19: 0.586, r20: 0.5706, r21: 0.5624, r22: 0.5518, r23: 0.5114, r24: 0.4474, r25: 0.4048, r26: 0.3469, r27: 0.3069, r28: 0.309, r29: 0.37, r30: 0.43, r31: 0.34, r32: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量。値は `radius` に対する比(負なら後ろへずれる)。上のほうは背中側へずれて、
    // 胸の下の出っ張りから肩甲骨の反りまでを表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0, r1: 0.0148, r2: 0.0404, r3: 0.0125, r4: 0.0246, r5: 0.0393, r6: 0.058, r7: 0.0805, r8: 0.1033, r9: 0.1205, r10: 0.1053, r11: 0.0968, r12: 0.0934, r13: 0.0667, r14: 0.0502, r15: 0.0134, r16: -0.0138, r17: -0.0581, r18: -0.1064, r19: -0.1525, r20: -0.185, r21: -0.2246, r22: -0.2621, r23: -0.3106, r24: -0.3536, r25: -0.3668, r26: -0.3308, r27: -0.2755, r28: -0.211, r29: -0.15, r30: -0.17, r31: -0.08, r32: -0.43 },
    },
    // 各高さの輪を前へ傾ける角度(度)。胴体は 0 で、胴体より前へ傾く首のあたりから増える(輪を首の軸に垂直にする)。
    // `radius` は繋がない(既定値 1 で、値がそのまま度数になる)。
    {
      id: 'tiltProfile',
      type: 'signedProfileCurve33',
      data: { r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0, r8: 0, r9: 0, r10: 0, r11: 0, r12: 0, r13: 0, r14: 0, r15: 0, r16: 0, r17: 0, r18: 0, r19: 0, r20: 0, r21: 0, r22: 0, r23: 0, r24: 0, r25: 2.2, r26: 8.1, r27: 15.5, r28: 18.8, r29: 28, r30: 25, r31: 25, r32: 25 },
    },
    // 輪を置く高さの割合。下端の丸み(球の極)や肩・首の付け根のように曲線が急に曲がる所へ輪を密に置いて、同じ段数(48)で、
    // 等間隔よりプロファイル曲線からのずれを約1/5(最大 7.8 → 1.7 mm)にしている。
    { id: 'ringSpacing', type: 'ringSpacingCurve', data: { r0: 0, r1: 0.0367, r2: 0.109, r3: 0.1954, r4: 0.3742, r5: 0.5403, r6: 0.6087, r7: 0.6647, r8: 0.777, r9: 0.8797, r10: 0.948, r11: 0.9913, r12: 1 } },
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
    { source: 'height', sourceHandle: 'value', target: 'tiltProfile', targetHandle: 'length' },

    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
    { source: 'tiltProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'tiltProfile' },
    { source: 'ringSpacing', sourceHandle: 'curve', target: 'gen', targetHandle: 'ringProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
