import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { Vector2 } from 'three';

export interface RampPointsData extends Record<string, unknown> {
  /** 0〜1 を何分割するか(点の数は `steps + 1`)。 */
  steps: number;
}

const DEFAULTS = { steps: 12 };

/** x=y=0〜1 を等間隔に刻んだ斜めの点列(`(k/steps, k/steps)`)を出力する汎用ノード。
 * `scalePointsY`/`translatePointsY`/`multiplyPointsY` で y だけを加工すると、x を横軸とした
 * 任意の曲線(`garmentParts.ts` の `necklineShapes()` のネックラインの落ち込み量など)を
 * 配線で組み立てられる。 */
registerNodeType<RampPointsData>({
  type: 'rampPoints',
  label: 'Ramp Points',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'points', label: 'Points', type: 'points' }],
  createDefaultData: () => ({ ...DEFAULTS }),
  evaluate: (_inputs, data): Record<string, SocketValue> => {
    const steps = Math.max(1, Math.round(data.steps ?? DEFAULTS.steps));
    const points = Array.from({ length: steps + 1 }, (_, k) => new Vector2(k / steps, k / steps));
    return { points: { type: 'points', value: points } };
  },
});
