import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** `points`(`easedLatheProfile` 等が出力する点列)の末尾から指定した個数だけ取り除く汎用
 * ノード。`belt.ts` が2つの `buildEasedLatheProfile()` の結果を連結する前に、接続点が
 * 重複しないよう `lower.slice(0, -1)` していた処理を、`beltGroupNode.ts` 側のノードグラフへ
 * 展開する際に使う(`dropEnd` は通常 `1` の固定値 `numberInput` を配線する)。 */
registerNodeType({
  type: 'slicePoints',
  label: 'Slice Points',
  category: 'generator',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'dropEnd', label: 'Drop End', type: 'number' },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const dropEnd = Math.max(0, Math.round(asNumber(inputs.dropEnd, 0)));
    const points = inputs.points.value;
    return { points: { type: 'points', value: dropEnd === 0 ? points : points.slice(0, points.length - dropEnd) } };
  },
});
