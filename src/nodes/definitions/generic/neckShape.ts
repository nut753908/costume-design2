import { defineGroupNode } from '../groupNodeFactory';

/** 首の形を、幅(X)・前側(+Z)・後ろ側(-Z)の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 中心が原点で、上端から下端まで `length` の高さに伸びる。
 *
 * `xProfile`/`frontProfile`/`backProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径
 * (`radius` の `r0`〜`r8` 倍、`r0` が下端で `r8` が上端、両端は 0 で丸く閉じる)をなめらかにつなぐ。
 * 円柱では表せない、あごの下で前側が広がる喉の形は、前側の輪郭の値そのもの(`headShape.ts` と同じ作り)。 */
defineGroupNode({
  type: 'neckShape',
  label: 'Neck Shape',
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
    { id: 'halfLength', type: 'numberHalf', data: {} },
    { id: 'negHalfLength', type: 'numberNegate', data: {} },
    // 値はいずれも `radius` に対する比(`r1` が下端側、`r7` が上端側)。
    { id: 'xProfile', type: 'profileCurve', data: { r0: 0, r1: 0.9606, r2: 0.9536, r3: 0.9292, r4: 0.9219, r5: 0.9433, r6: 1.042, r7: 1.151, r8: 0 } },
    { id: 'frontProfile', type: 'profileCurve', data: { r0: 0, r1: 0.7073, r2: 0.7904, r3: 0.8977, r4: 1.028, r5: 1.165, r6: 1.294, r7: 1.4, r8: 0 } },
    { id: 'backProfile', type: 'profileCurve', data: { r0: 0, r1: 0.8838, r2: 0.9368, r3: 0.9643, r4: 0.99, r5: 1.055, r6: 1.207, r7: 1.4, r8: 0 } },
    { id: 'gen', type: 'loftGenerator', data: { steps: 32, segments: 32 } },
    // 原点が下端の輪郭を、中心が原点になるよう半分の長さだけ下げる。
    { id: 'center', type: 'translate', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'length', target: 'halfLength', targetHandle: 'value' },
    { source: 'halfLength', sourceHandle: 'value', target: 'negHalfLength', targetHandle: 'value' },
    ...['xProfile', 'frontProfile', 'backProfile'].flatMap((id) => [
      { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
      { source: 'input', sourceHandle: 'length', target: id, targetHandle: 'length' },
    ]),
    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'frontProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'backProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'backProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'center', targetHandle: 'geometry' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'center', targetHandle: 'y' },
    { source: 'center', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
