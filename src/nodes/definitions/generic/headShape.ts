import { defineGroupNode } from '../groupNodeFactory';

/** 頭の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が頭の下端(あご)で、+Y へ `radius × 2 × heightRatio` の高さまで伸びる(下面は `dropProfile`
 * の分だけ原点より下がる)。`bodyGroupNode.ts` が下端を首の上端に合わせて配置する。
 *
 * `xProfile`/`depthProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径(`radius` の
 * `r0`〜`r8` 倍、両端は 0 で丸く閉じる)をなめらかにつなぐ。前後は同じ半径の1つの楕円で、後頭部の張り出しや
 * あごの引き込みのような前後非対称の形は、各高さの輪を前後へずらす `offsetProfile`(`signedProfileCurve`)で
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
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6324, r2: 0.8194, r3: 0.8261, r4: 0.8951, r5: 0.908, r6: 0.8528, r7: 0.746, r8: 0 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6079, r2: 0.814, r3: 0.9163, r4: 0.9728, r5: 0.9826, r6: 0.9212, r7: 0.7664, r8: 0 },
    },
    // 各高さの輪を前(+Z)へずらす量(`radius` に対する比)。後頭部の張り出しやあごの引き込みの前後非対称を表す。
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve',
      data: { r0: 0, r1: 0.1727, r2: -0.0615, r3: -0.0681, r4: -0.03524, r5: -0.0165, r6: -0.01947, r7: -0.0323, r8: 0 },
    },
    // 高さごとに輪を丸ごと下げる量(`radius` に対する比)。下側の数点だけを非ゼロにして、あごの下面を下げる。
    {
      id: 'dropProfile',
      type: 'profileCurve',
      data: { r0: 0.05461, r1: 0.0267, r2: 0.0432, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0, r8: 0 },
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
