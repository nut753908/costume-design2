import { defineGroupNode } from '../groupNodeFactory';

/** 腕/脚1本の軸(肩/股の丸みから手首/足首まで)の形を、幅(X)・前後の厚み(Z)・前後のずらし量の3本の輪郭曲線から作る
 * グループノード(`armShaft`/`legShaft`、`bodyGroupNode.ts` が使う)。中心が原点で、`length + 2 × radius` の高さに
 * 伸びる(`length` は付け根と先端の球の中心どうしの距離。軸の両端を球の半径ぶん球の外側まで伸ばし、`r1`/`r7` が
 * 先端/付け根の球の中心の高さになるので、球とのつなぎ目にくびれができない)。
 *
 * `xProfile`/`depthProfile`(いずれも `profileCurve`)と、輪を前後へずらす `offsetProfile`(`signedProfileCurve`)が、高さを 8 等分した 9 点の値
 * (`radius` の `r0`〜`r8` 倍、`r0` が下端で `r8` が上端、両端は 0 で丸く閉じる)をなめらかにつなぐ。
 * 太ももの太さや腕の付け根のなだらかさは、この3枚のカードの入力欄の値そのもの(`headShape.ts` と同じ作り)。
 * 腕と脚は形が違うので、同じ構成で別の値を持つ別ノードにしている。 */
function defineLimbShaft(config: { type: string; label: string; profile: string }): void {
  const curve = (id: string, data: Record<string, number>) => ({ id, type: 'profileCurve', data });
  defineGroupNode({
    type: config.type,
    label: config.label,
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
      { id: 'radiusDoubled', type: 'numberMultiply', data: { factor: 2 } },
      { id: 'height', type: 'numberAdd', data: {} },
      { id: 'halfHeight', type: 'numberHalf', data: {} },
      { id: 'negHalfHeight', type: 'numberNegate', data: {} },
      curve('xProfile', PROFILES[config.type].x),
      curve('depthProfile', PROFILES[config.type].depth),
      { id: 'offsetProfile', type: 'signedProfileCurve', data: PROFILES[config.type].offset },
      { id: 'gen', type: 'loftGenerator', data: { steps: 48, segments: 48 } },
      // 原点が下端の輪郭を、中心が原点になるよう半分の高さだけ下げる。
      { id: 'center', type: 'translate', data: {} },
      {
        id: 'output',
        type: 'groupOutput',
        data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
      },
    ],
    internalEdges: [
      { source: 'input', sourceHandle: 'radius', target: 'radiusDoubled', targetHandle: 'value' },
      { source: 'input', sourceHandle: 'length', target: 'height', targetHandle: 'a' },
      { source: 'radiusDoubled', sourceHandle: 'value', target: 'height', targetHandle: 'b' },
      { source: 'height', sourceHandle: 'value', target: 'halfHeight', targetHandle: 'value' },
      { source: 'halfHeight', sourceHandle: 'value', target: 'negHalfHeight', targetHandle: 'value' },
      ...['xProfile', 'depthProfile', 'offsetProfile'].flatMap((id) => [
        { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
        { source: 'height', sourceHandle: 'value', target: id, targetHandle: 'length' },
      ]),
      { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
      { source: 'depthProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
      { source: 'offsetProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'offsetZProfile' },
      { source: 'gen', sourceHandle: 'geometry', target: 'center', targetHandle: 'geometry' },
      { source: 'negHalfHeight', sourceHandle: 'value', target: 'center', targetHandle: 'y' },
      { source: 'center', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    ],
  });
}

// 値はいずれも `radius` に対する比(`r1` が下端側、`r7` が上端側)。`offset` は輪を前(+Z)へずらす量。
const PROFILES: Record<string, { x: Record<string, number>; depth: Record<string, number>; offset: Record<string, number> }> = {
  armShaft: {
    x: { r0: 0, r1: 0.7355, r2: 0.7479, r3: 0.9191, r4: 0.8854, r5: 0.9001, r6: 0.8982, r7: 0.9919, r8: 0 },
    depth: { r0: 0, r1: 0.9424, r2: 0.8107, r3: 0.9418, r4: 0.8413, r5: 0.8261, r6: 0.7913, r7: 0.8507, r8: 0 },
    offset: { r0: 0, r1: 0.1045, r2: 0.0669, r3: 0.07416, r4: 0.00645, r5: -0.09303, r6: -0.211, r7: -0.2471, r8: 0 },
  },
  legShaft: {
    x: { r0: 0, r1: 0.441, r2: 0.487, r3: 0.6192, r4: 0.6895, r5: 0.684, r6: 0.8126, r7: 1.049, r8: 0 },
    depth: { r0: 0, r1: 0.4759, r2: 0.5391, r3: 0.6551, r4: 0.7748, r5: 0.7731, r6: 0.8691, r7: 1, r8: 0 },
    offset: { r0: 0, r1: 0.1579, r2: 0.01759, r3: -0.07613, r4: -0.08494, r5: 0.05168, r6: 0.02106, r7: -0.08258, r8: 0 },
  },
};

defineLimbShaft({ type: 'armShaft', label: 'Arm Shaft', profile: 'arm' });
defineLimbShaft({ type: 'legShaft', label: 'Leg Shaft', profile: 'leg' });
