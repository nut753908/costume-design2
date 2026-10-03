import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { SignedSplineCurve } from '../../../geometry/splineProfile';

/** 制御点の数(等間隔の高さ)。 */
const CONTROL_POINTS = 9;

/** `profileCurve` の符号付き版。高さ 0 から `length` までを等間隔に 9 個へ分け、各点の値(`radius` の
 * `r0`〜`r8` 倍、負でもよい)をなめらかにつないだ `(値, 高さ)` の曲線を出力する(`geometry/splineProfile.ts`)。
 * `profileCurve` は半径の2乗を補間するので 0 未満を表せないが、これは輪の前後のずらし量のような符号付きの
 * 量に使う。既定は全点 0(= 何も動かさない)。 */
registerNodeType({
  type: 'signedProfileCurve',
  label: 'Signed Profile Curve',
  category: 'curve',
  inputs: [
    { id: 'radius', label: 'Radius', type: 'number', default: 1 },
    { id: 'length', label: 'Length', type: 'number', default: 1 },
    ...Array.from({ length: CONTROL_POINTS }, (_, i) => ({ id: `r${i}`, label: `R${i}`, type: 'number' as const, default: 0 })),
  ],
  outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const radius = asNumber(inputs.radius, 1);
    const length = asNumber(inputs.length, 1);
    const values = Array.from({ length: CONTROL_POINTS }, (_, i) => radius * asNumber(inputs[`r${i}`], 0));
    return { curve: { type: 'curve', value: new SignedSplineCurve(values, length) } };
  },
});
