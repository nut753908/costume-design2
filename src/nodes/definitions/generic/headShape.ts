import { defineGroupNode } from '../groupNodeFactory';

/** 頭の形を、幅(X)・前側(+Z)・後ろ側(-Z)の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 原点が頭の下端(あご)で、+Y へ `radius × 2 × heightRatio` の高さまで伸びる。`bodyGroupNode.ts` が
 * 下端を首の上端に合わせて配置する。
 *
 * `xProfile`/`frontProfile`/`backProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径
 * (`radius` の `r0`〜`r8` 倍、両端は 0 で丸く閉じる)をなめらかにつなぐ。前側と後ろ側を別々にできるので、
 * 後頭部の張り出しやあごの引き込みのような前後非対称の形も表せる(`torsoShape.ts` と同じ作り)。
 *
 * 初期値は、へこみのないなめらかなたまご形 `r(t) = A × sin(π × t^p)^q`(t はあご 0〜頭頂 1)の値。輪郭に
 * へこみがあると、トゥーンの4段階の帯が不規則な島状のまだらに割れて見えるので、凸に保っている。 */
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

    // 値はいずれも `radius` に対する比。
    {
      id: 'xProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6063, r2: 0.7658, r3: 0.8587, r4: 0.9037, r5: 0.9024, r6: 0.8476, r7: 0.7139, r8: 0 },
    },
    {
      id: 'frontProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6642, r2: 0.839, r3: 0.9408, r4: 0.9901, r5: 0.9887, r6: 0.9286, r7: 0.7821, r8: 0 },
    },
    {
      id: 'backProfile',
      type: 'profileCurve',
      data: { r0: 0, r1: 0.6651, r2: 0.8401, r3: 0.942, r4: 0.9914, r5: 0.9899, r6: 0.9298, r7: 0.7832, r8: 0 },
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
