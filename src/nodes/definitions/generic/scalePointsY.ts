import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** `points` の Y だけを `factor` 倍する汎用ノード(`translatePointsY` の倍率版)。 */
registerNodeType({
  type: 'scalePointsY',
  label: 'Scale Points Y',
  category: 'generator',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'factor', label: 'Factor', type: 'number' },
  ],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const factor = asNumber(inputs.factor, 1);
    return { points: { type: 'points', value: inputs.points.value.map((p) => p.clone().setY(p.y * factor)) } };
  },
});
