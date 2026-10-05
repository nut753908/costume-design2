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
// 脚の `r2`〜`r6` は、参照を脚の軸に垂直な面で切った断面から直接測った値(両端の `r1`/`r7` は足・胴体と断面が融合して測れないので、探索で合わせた値)。
// 腕の `r2`〜`r7` も同様に、参照の腕の軸(取り付け位置と向きは、腕の断面の中心を結んだ直線から求めたもの)に垂直な断面から測った値(`r1` は胴体の輪が混ざるので探索値)。
const PROFILES: Record<string, { x: Record<string, number>; depth: Record<string, number>; offset: Record<string, number> }> = {
  armShaft: {
    x: { r0: 0, r1: 0.7355, r2: 0.7528, r3: 0.8646, r4: 0.8326, r5: 0.7286, r6: 0.7427, r7: 0.874, r8: 0 },
    depth: { r0: 0, r1: 0.9424, r2: 0.7892, r3: 0.8595, r4: 0.8295, r5: 0.7603, r6: 0.8155, r7: 0.8171, r8: 0 },
    offset: { r0: 0, r1: 0.1045, r2: -0.006838, r3: 0.08646, r4: 0.01435, r5: -0.05349, r6: -0.001213, r7: 0.04746, r8: 0 },
  },
  legShaft: {
    x: { r0: 0, r1: 0.441, r2: 0.5391, r3: 0.6391, r4: 0.71, r5: 0.7122, r6: 0.9004, r7: 1.049, r8: 0 },
    depth: { r0: 0, r1: 0.4759, r2: 0.5398, r3: 0.6768, r4: 0.7629, r5: 0.785, r6: 0.8994, r7: 1, r8: 0 },
    offset: { r0: 0, r1: 0.1579, r2: 0.02934, r3: -0.08356, r4: -0.05032, r5: 0.0756, r6: -0.01949, r7: -0.08258, r8: 0 },
  },
};

defineLimbShaft({ type: 'armShaft', label: 'Arm Shaft', profile: 'arm' });
defineLimbShaft({ type: 'legShaft', label: 'Leg Shaft', profile: 'leg' });
