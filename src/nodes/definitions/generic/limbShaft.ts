import { defineGroupNode } from '../groupNodeFactory';

/** 腕/脚1本の軸(関節の球と先端の球のあいだ)の形を、幅(X)・前側(+Z)・後ろ側(-Z)の3本の輪郭曲線から作る
 * グループノード(`armShaft`/`legShaft`、`bodyGroupNode.ts` が使う)。中心が原点で、`length + 2 × radius` の高さに
 * 伸びる(`length` は付け根と先端の球の中心どうしの距離。軸の両端を球の半径ぶん球の外側まで伸ばし、`r1`/`r7` が
 * 先端/付け根の球の中心の高さになるので、球とのつなぎ目にくびれができない)。
 *
 * `xProfile`/`frontProfile`/`backProfile`(いずれも `profileCurve`)が、高さを 8 等分した 9 点の半径
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
      curve('frontProfile', PROFILES[config.type].front),
      curve('backProfile', PROFILES[config.type].back),
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
      ...['xProfile', 'frontProfile', 'backProfile'].flatMap((id) => [
        { source: 'input', sourceHandle: 'radius', target: id, targetHandle: 'radius' },
        { source: 'height', sourceHandle: 'value', target: id, targetHandle: 'length' },
      ]),
      { source: 'xProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
      { source: 'frontProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'depthProfile' },
      { source: 'backProfile', sourceHandle: 'curve', target: 'gen', targetHandle: 'backProfile' },
      { source: 'gen', sourceHandle: 'geometry', target: 'center', targetHandle: 'geometry' },
      { source: 'negHalfHeight', sourceHandle: 'value', target: 'center', targetHandle: 'y' },
      { source: 'center', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    ],
  });
}

// 値はいずれも `radius` に対する比(`r1` が下端側、`r7` が上端側)。
const PROFILES: Record<string, { x: Record<string, number>; front: Record<string, number>; back: Record<string, number> }> = {
  armShaft: {
    x: { r0: 0, r1: 0.7402, r2: 0.7643, r3: 0.8183, r4: 0.8779, r5: 0.9436, r6: 0.9395, r7: 0.9174, r8: 0 },
    front: { r0: 0, r1: 0.8474, r2: 0.9658, r3: 1.017, r4: 0.9357, r5: 0.7922, r6: 0.6541, r7: 0.519, r8: 0 },
    back: { r0: 0, r1: 0.6587, r2: 0.7937, r3: 0.88, r4: 0.904, r5: 0.9376, r6: 1.053, r7: 1.167, r8: 0 },
  },
  legShaft: {
    x: { r0: 0, r1: 0.4728, r2: 0.6016, r3: 0.6826, r4: 0.7604, r5: 0.8352, r6: 0.8865, r7: 1.018, r8: 0 },
    front: { r0: 0, r1: 0.4647, r2: 0.5277, r3: 0.646, r4: 0.722, r5: 0.8098, r6: 0.8902, r7: 0.9206, r8: 0 },
    back: { r0: 0, r1: 0.3056, r2: 0.4901, r3: 0.7184, r4: 0.8357, r5: 0.7826, r6: 0.8414, r7: 1.051, r8: 0 },
  },
};

defineLimbShaft({ type: 'armShaft', label: 'Arm Shaft', profile: 'arm' });
defineLimbShaft({ type: 'legShaft', label: 'Leg Shaft', profile: 'leg' });
