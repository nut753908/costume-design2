import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** `points`(`easedLatheProfile` 等が出力する点列)を Y方向にだけ平行移動する汎用ノード。
 * `translate`(geometry 版)の points 版 — `belt.ts` が `buildEasedLatheProfile()` の結果
 * (`lower`)に対して手作業で行っていた `for (const p of lower) p.y -= half;` という
 * ループを、`beltGroupNode.ts` 側のノードグラフへ展開する際に使う。 */
registerNodeType({
  type: 'translatePointsY',
  label: 'Translate Points Y',
  category: 'points',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'y', label: 'Y', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const y = asNumber(inputs.y, 0);
    return { points: { type: 'points', value: inputs.points.value.map((p) => p.clone().setY(p.y + y)) } };
  },
});
