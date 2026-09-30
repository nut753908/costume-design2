import { defineGroupNode } from '../groupNodeFactory';

/** 頭の形を、幅(X)・前側(+Z)・後ろ側(-Z)の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が頭の下端(あご)で、+Y へ `radius × 2 × heightRatio` の高さまで伸びる。`bodyGroupNode.ts` が
 * 下端を首の上端に合わせて配置する。
 *
 * `xProfile`/`frontProfile`/`backProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径
 * (`radius` の `r0`〜`r8` 倍、両端は 0 で丸く閉じる)をなめらかにつなぐ。前側と後ろ側を別々にして、
 * 後頭部の張り出しやあごの引き込みのような前後非対称の形を、2枚の `profileCurve` カードの値で表す
 * (`torsoShape.ts` と同じ作り。前後を別々にできる点だけが違う)。 */
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
      data: { r0: 0, r1: 0.7112, r2: 0.7929, r3: 0.8582, r4: 0.9026, r5: 0.899, r6: 0.8381, r7: 0.7593, r8: 0 },
    },
    {
      id: 'frontProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.7672, r2: 0.8081, r3: 0.8796, r4: 0.9637, r5: 0.9868, r6: 0.9292, r7: 0.8134, r8: 0 },
    },
    {
      id: 'backProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6329, r2: 0.8575, r3: 0.9969, r4: 1.047, r5: 1.023, r6: 0.9636, r7: 0.8656, r8: 0 },
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
    // height = radius × 2 × heightRatio
    { source: 'input', sourceHandle: 'radius', target: 'diameter', targetHandle: 'value' },
    { source: 'diameter', sourceHandle: 'value', target: 'height', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'heightRatio', target: 'height', targetHandle: 'factor' },

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
