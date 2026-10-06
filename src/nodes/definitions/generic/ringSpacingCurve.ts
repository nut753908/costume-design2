import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { RingSpacingCurve } from '../../../geometry/ringSpacing';

const POINTS = 13;

/** `loftGenerator` の `ringProfile` へ繋ぐ、輪を置く高さの割合の曲線(`geometry/ringSpacing.ts`)を作る。
 * `r0`〜`r12` は、輪の通し番号の割合 `k / 12` での、曲線全体の高さに対する輪の高さの割合(0〜1、単調に増やす)。
 * 既定は `k / 12`(等間隔の輪)。曲線が急に曲がる所(球の極のような端、肩、あご)の近くの値を小さく/大きくして、
 * そこへ輪を密に置く。 */
registerNodeType({
  type: 'ringSpacingCurve',
  label: 'Ring Spacing Curve',
  category: 'curve',
  inputs: Array.from({ length: POINTS }, (_, k) => ({
    id: `r${k}`,
    label: `R${k}`,
    type: 'number' as const,
    default: k / (POINTS - 1),
  })),
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const values = Array.from({ length: POINTS }, (_, k) => asNumber(inputs[`r${k}`], k / (POINTS - 1)));
    return { curve: { type: 'curve', value: new RingSpacingCurve(values) } };
  },
});
