import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { PchipProfileCurve } from '../../../geometry/pchipProfile';

/** 制御点の数(等間隔の高さ)。 */
const CONTROL_POINTS = 9;

/** 高さ 0 から `length` までを等間隔に `CONTROL_POINTS` 個へ分け、各点の半径(`radius` の `r0`〜`r8` 倍)を
 * なめらかにつないだ `(半径, 高さ)` の曲線を出力する汎用ノード(`geometry/pchipProfile.ts`)。
 * `latheGenerator`/`loftGenerator` の輪郭に使う。両端の `r0`/`r8` が 0 なら、その端は球の極のように
 * 丸く閉じる。 */
registerNodeType({
  type: 'profileCurve',
  label: 'Profile Curve',
  category: 'curve',
  inputs: [
    { id: 'radius', label: 'Radius', type: 'number', default: 1 },
    { id: 'length', label: 'Length', type: 'number', default: 1 },
    ...Array.from({ length: CONTROL_POINTS }, (_, i) => ({
      id: `r${i}`,
      label: `R${i}`,
      type: 'number' as const,
      default: i === 0 || i === CONTROL_POINTS - 1 ? 0 : 1,
    })),
  ],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const radius = asNumber(inputs.radius, 1);
    const length = asNumber(inputs.length, 1);
    const radii = Array.from({ length: CONTROL_POINTS }, (_, i) =>
      radius * asNumber(inputs[`r${i}`], i === 0 || i === CONTROL_POINTS - 1 ? 0 : 1),
    );
    return { curve: { type: 'curve', value: new PchipProfileCurve(radii, length) } };
  },
});
