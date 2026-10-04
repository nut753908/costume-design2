import { defineGroupNode } from '../groupNodeFactory';

/** 首の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る、`bodyGroupNode.ts` 用のグループノード。
 * 中心が原点で、上端から下端まで `length` の高さに伸びる。
 *
 * `xProfile`/`depthProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径(`radius` の
 * `r0`〜`r8` 倍、`r0` が下端で `r8` が上端、両端は 0 で丸く閉じる)をなめらかにつなぐ。前後は同じ半径の1つの
 * 楕円で、あごの下で前側が広がる喉の形は、各高さの輪を前後へずらす `offsetProfile`(`signedProfileCurve`)で表す
 * (`headShape.ts` と同じ作り)。 */
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
    { id: 'xProfile', type: 'profileCurve', data: { r0: 0, r1: 0.9607, r2: 0.9557, r3: 0.9371, r4: 0.9141, r5: 0.9362, r6: 1.03, r7: 1.139, r8: 0 } },
    { id: 'depthProfile', type: 'profileCurve', data: { r0: 0, r1: 0.7948, r2: 0.8672, r3: 0.9285, r4: 1.003, r5: 1.118, r6: 1.253, r7: 1.398, r8: 0 } },
    // 各高さの輪を前(+Z)へずらす量(`radius` に対する比)。
    { id: 'offsetProfile', type: 'signedProfileCurve', data: { r0: 0, r1: -0.1004, r2: -0.08215, r3: -0.03125, r4: 0.0226, r5: 0.0555, r6: 0.05, r7: 0.0015, r8: 0 } },
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
    ...['xProfile', 'depthProfile', 'offsetProfile'].flatMap((id) => [
      { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
      { source: 'input', sourceHandle: 'length', target: id, targetHandle: 'length' },
    ]),
    { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
    { source: 'gen', sourceHandle: 'geometry', target: 'center', targetHandle: 'geometry' },
    { source: 'negHalfLength', sourceHandle: 'value', target: 'center', targetHandle: 'y' },
    { source: 'center', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
