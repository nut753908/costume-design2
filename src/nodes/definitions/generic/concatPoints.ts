import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 2つの `points`(`easedLatheProfile` 等が出力する点列)を1つに連結する汎用ノード。
 * `geometry` の `mergeGeometry` に対応する points 版 — `beltGroupNode.ts` が上半分・下半分の
 * プロファイルを連結するのに使う。 */
registerNodeType({
  type: 'concatPoints',
  label: 'Concat Points',
  category: 'points',
  inputs: [
    { id: 'pointsA', label: 'Points A', type: 'points' },
    { id: 'pointsB', label: 'Points B', type: 'points' },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.pointsA || inputs.pointsA.type !== 'points') return {};
    if (!inputs.pointsB || inputs.pointsB.type !== 'points') return {};
    return { points: { type: 'points', value: [...inputs.pointsA.value, ...inputs.pointsB.value] } };
  },
});
