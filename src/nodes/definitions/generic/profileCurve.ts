import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { SplineProfileCurve } from '../../../geometry/splineProfile';

/** 高さ 0 から `length` までを等間隔に `points` 個へ分け、各点の半径(`radius` の `r0`〜`r<points-1>` 倍)を
 * なめらかにつないだ `(半径, 高さ)` の曲線を出力する汎用ノード(`geometry/splineProfile.ts`)を登録する。
 * `latheGenerator`/`loftGenerator` の輪郭に使う。両端の `r0`/`r<points-1>` が 0 なら、その端は球の極のように
 * 丸く閉じる。制御点の数は形の複雑さに合わせて選ぶ(`profileCurve` は 9 点、`profileCurve13` は 13 点、
 * `profileCurve17` は 17 点)。 */
function defineProfileCurve(type: string, label: string, points: number): void {
  registerNodeType({
    type,
    label,
    category: 'curve',
    inputs: [
      { id: 'radius', label: 'Radius', type: 'number', default: 1 },
      { id: 'length', label: 'Length', type: 'number', default: 1 },
      ...Array.from({ length: points }, (_, i) => ({
        id: `r${i}`,
        label: `R${i}`,
        type: 'number' as const,
        default: i === 0 || i === points - 1 ? 0 : 1,
      })),
    ],
    outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
    createDefaultData: () => ({}),
    evaluate: (inputs): Record<string, SocketValue> => {
      const radius = asNumber(inputs.radius, 1);
      const length = asNumber(inputs.length, 1);
      const radii = Array.from({ length: points }, (_, i) =>
        radius * asNumber(inputs[`r${i}`], i === 0 || i === points - 1 ? 0 : 1),
      );
      return { curve: { type: 'curve', value: new SplineProfileCurve(radii, length) } };
    },
  });
}

defineProfileCurve('profileCurve', 'Profile Curve', 9);
defineProfileCurve('profileCurve13', 'Profile Curve (13)', 13);
defineProfileCurve('profileCurve17', 'Profile Curve (17)', 17);
