import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { SignedSplineCurve } from '../../../geometry/splineProfile';

/** `profileCurve` の符号付き版。高さ 0 から `length` までを等間隔に `points` 個へ分け、各点の値(`radius` の
 * `r0`〜`r<points-1>` 倍、負でもよい)をなめらかにつないだ `(値, 高さ)` の曲線を出力する汎用ノード
 * (`geometry/splineProfile.ts`)を登録する。`profileCurve` は半径の2乗を補間するので 0 未満を表せないが、これは
 * 輪の前後のずらし量のような符号付きの量に使う。既定は全点 0(= 何も動かさない)。制御点の数は
 * `signedProfileCurve` が 9 点、`signedProfileCurve13` が 13 点、`signedProfileCurve17` が 17 点、`signedProfileCurve25` が 25 点、`signedProfileCurve33` が 33 点。 */
function defineSignedProfileCurve(type: string, label: string, points: number): void {
  registerNodeType({
    type,
    label,
    category: 'curve',
    inputs: [
      { id: 'radius', label: 'Radius', type: 'number', default: 1 },
      { id: 'length', label: 'Length', type: 'number', default: 1 },
      ...Array.from({ length: points }, (_, i) => ({ id: `r${i}`, label: `R${i}`, type: 'number' as const, default: 0 })),
    ],
    outputs: [{ id: 'curve', label: 'Curve', type: 'curve' }],
    createDefaultData: () => ({}),
    evaluate: (inputs): Record<string, SocketValue> => {
      const radius = asNumber(inputs.radius, 1);
      const length = asNumber(inputs.length, 1);
      const values = Array.from({ length: points }, (_, i) => radius * asNumber(inputs[`r${i}`], 0));
      return { curve: { type: 'curve', value: new SignedSplineCurve(values, length) } };
    },
  });
}

defineSignedProfileCurve('signedProfileCurve', 'Signed Profile Curve', 9);
defineSignedProfileCurve('signedProfileCurve13', 'Signed Profile Curve (13)', 13);
defineSignedProfileCurve('signedProfileCurve17', 'Signed Profile Curve (17)', 17);
defineSignedProfileCurve('signedProfileCurve25', 'Signed Profile Curve (25)', 25);
defineSignedProfileCurve('signedProfileCurve33', 'Signed Profile Curve (33)', 33);
