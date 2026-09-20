import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 2つの `points` の Y 同士を要素ごとに掛ける汎用ノード。x は `pointsA` のものを引き継ぎ、
 * 点の数は短い方に揃える(同じ x を刻んだ点列同士で使う前提)。 */
registerNodeType({
  type: 'multiplyPointsY',
  label: 'Multiply Points Y',
  category: 'generator',
  inputs: [
    { id: 'pointsA', label: 'Points A', type: 'points' },
    { id: 'pointsB', label: 'Points B', type: 'points' },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.pointsA || inputs.pointsA.type !== 'points') return {};
    if (!inputs.pointsB || inputs.pointsB.type !== 'points') return {};
    const b = inputs.pointsB.value;
    const length = Math.min(inputs.pointsA.value.length, b.length);
    const points = inputs.pointsA.value.slice(0, length).map((p, i) => p.clone().setY(p.y * b[i].y));
    return { points: { type: 'points', value: points } };
  },
});
