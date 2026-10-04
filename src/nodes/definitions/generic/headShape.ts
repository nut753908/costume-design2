import { defineGroupNode } from '../groupNodeFactory';

/** 頭の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が頭の下端(あご)で、+Y へ `radius × 2 × heightRatio` の高さまで伸びる(下面は `dropProfile`
 * の分だけ原点より下がる)。`bodyGroupNode.ts` が下端を首の上端に合わせて配置する。
 *
 * `xProfile`/`depthProfile`/`dropProfile`(`profileCurve17`)と `offsetProfile`(`signedProfileCurve17`)は、高さを 16 等分した
 * 17 点の値(`radius` の `r0`〜`r16` 倍、`xProfile`/`depthProfile` は両端 0 で丸く閉じる)をなめらかにつなぐ(あごの下面や
 * 後頭部の細かい形に追従するため 17 点。点が多いと輪郭が波打ちやすいので隣り合う点は滑らかに変えること)。前後は同じ半径の1つの楕円で、後頭部の張り出しや
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
      data: { r0: 0, r1: 0.453, r2: 0.645, r3: 0.7688, r4: 0.8194, r5: 0.8278, r6: 0.8261, r7: 0.8564, r8: 0.8951, r9: 0.913, r10: 0.908, r11: 0.8844, r12: 0.8528, r13: 0.8177, r14: 0.746, r15: 0.6039, r16: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve17',
      data: { r0: 0, r1: 0.436, r2: 0.5957, r3: 0.7274, r4: 0.814, r5: 0.8737, r6: 0.9163, r7: 0.9492, r8: 0.9728, r9: 0.9854, r10: 0.9826, r11: 0.9604, r12: 0.9212, r13: 0.864, r14: 0.7664, r15: 0.6051, r16: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量(`radius` に対する比)。後頭部の張り出しやあごの引き込みの前後非対称を表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0, r1: 0.2539, r2: 0.1589, r3: 0.04706, r4: -0.05158, r5: -0.08425, r6: -0.07943, r7: -0.05898, r8: -0.03524, r9: -0.02431, r10: -0.0205, r11: -0.01785, r12: -0.02147, r13: -0.02614, r14: -0.0313, r15: -0.04848, r16: 0 },
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
