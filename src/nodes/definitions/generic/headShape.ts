import { defineGroupNode } from '../groupNodeFactory';

/** 頭の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が頭の下端(あご)で、+Y へ `radius × 2 × heightRatio` の高さまで伸びる(下面は `dropProfile`
 * の分だけ原点より下がる)。`bodyGroupNode.ts` が下端を首の上端に合わせて配置する。
 *
 * `xProfile`/`depthProfile`/`dropProfile`(`profileCurve17`)と `offsetProfile`(`signedProfileCurve17`)は、高さを 16 等分した
 * 17 点の値(`radius` の `r0`〜`r16` 倍、`xProfile`/`depthProfile` は両端 0 で丸く閉じる)をなめらかにつなぐ(あごの下面や
 * 後頭部の細かい形に追従するため 17 点)。`xProfile`/`depthProfile`/`offsetProfile` の値は探索ではなく、参照を水平に
 * 切った断面から、幅・前後の厚み・ずらしを直接測ったもの(断面積が合うよう楕円の大きさを補正している)。前後は同じ半径の1つの楕円で、後頭部の張り出しや
 * 前後は同じ半径の1つの楕円で、後頭部の張り出しやあごの引き込みのような前後非対称の形は、各高さの輪を前後へずらす `offsetProfile`(`signedProfileCurve`)で
 * 表す(`torsoShape.ts` と同じ作り。前後別々の半径だと側面の継ぎ目に稜線が立つ)。 */
defineGroupNode({
  type: 'headShape',
  label: 'Head Shape',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'heightRatio', label: 'Height Ratio', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'diameter', type: 'numberMultiply', data: { factor: 2 } },
    { id: 'height', type: 'numberMultiply', data: {} },

    // 値はいずれも `radius` に対する比(球の輪郭から±0.06以内に収めて、丸い頭のまま前後のずれだけ取り込んでいる)。
    {
      id: 'xProfile',
      type: 'profileCurve17',
      data: { r0: 0, r1: 0.4255, r2: 0.6226, r3: 0.764, r4: 0.8211, r5: 0.8286, r6: 0.838, r7: 0.8636, r8: 0.8962, r9: 0.8971, r10: 0.8943, r11: 0.8891, r12: 0.8529, r13: 0.7985, r14: 0.7322, r15: 0.5863, r16: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve17',
      data: { r0: 0, r1: 0.419, r2: 0.6075, r3: 0.7012, r4: 0.7847, r5: 0.8552, r6: 0.9139, r7: 0.9583, r8: 0.9774, r9: 0.9961, r10: 0.9925, r11: 0.9626, r12: 0.9329, r13: 0.8779, r14: 0.7787, r15: 0.5895, r16: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量(`radius` に対する比)。後頭部の張り出しやあごの引き込みの前後非対称を表す。
    // 下端の極(`r0`)も前へずらす(0 のままだと、極が軸の中心線に戻って、あごの下面が後ろへ引っ込む)。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0.3, r1: 0.1923, r2: 0.163, r3: 0.06692, r4: -0.04608, r5: -0.08346, r6: -0.07548, r7: -0.05378, r8: -0.03455, r9: -0.01699, r10: -0.017, r11: -0.01982, r12: -0.02149, r13: -0.02689, r14: -0.03608, r15: -0.05574, r16: 0 },
    },
    // 高さごとに輪を丸ごと下げる量(`radius` に対する比)。下側の数点だけを非ゼロにして、あごの下面を下げる。
    {
      id: 'dropProfile',
      type: 'profileCurve17',
      data: { r0: 0.021, r1: 0.04099, r2: 0.0227, r3: 0.04128, r4: 0.0302, r5: 0.01675, r6: 0.015, r7: 0.011, r8: 0, r9: -0.0002369, r10: 0.008, r11: 0.008, r12: 0.002, r13: -0.001847, r14: 0.008, r15: 0, r16: 0 },
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
    // height = radius × 2 × heightRatio
    { source: 'input', sourceHandle: 'radius', target: 'diameter', targetHandle: 'value' },
    { source: 'diameter', sourceHandle: 'value', target: 'height', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightRatio', target: 'height', targetHandle: 'factor' },

    { source: 'input', sourceHandle: 'radius', target: 'xProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'xProfile', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'radius', target: 'depthProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'depthProfile', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'radius', target: 'offsetProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'offsetProfile', targetHandle: 'length' },

    { source: 'input', sourceHandle: 'radius', target: 'dropProfile', targetHandle: 'radius' },
    { source: 'height', sourceHandle: 'value', target: 'dropProfile', targetHandle: 'length' },

    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
    { source: 'dropProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'dropProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
