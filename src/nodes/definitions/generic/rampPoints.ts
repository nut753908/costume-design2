import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { Vector2 } from 'three';

const DEFAULTS = { steps: 12 };

/** x=y=0〜1 を等間隔に刻んだ斜めの点列(`(k/steps, k/steps)`)を出力する汎用ノード。
 * `scalePointsY`/`translatePointsY`/`multiplyPointsY` で y だけを加工すると、x を横軸とした
 * 任意の曲線(`generic/necklineShapes.ts` の `necklineShapes` グループのネックラインの落ち込み量など)を
 * 配線で組み立てられる。 */
registerNodeType({
  type: 'rampPoints',
  label: 'Ramp Points',
  category: 'points',
  inputs: [{ id: 'steps', label: 'Steps', type: 'number', default: DEFAULTS.steps }],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const steps = Math.max(1, Math.round(asNumber(inputs.steps, DEFAULTS.steps)));
    const points = Array.from({ length: steps + 1 }, (_, k) => new Vector2(k / steps, k / steps));
    return { points: { type: 'points', value: points } };
  },
});
