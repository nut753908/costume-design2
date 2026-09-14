import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';
import { computeBodyDimensions } from '../../geometry/body';

/** `geometry/body.ts` の `computeBodyDimensions()`(Height/Build/Shoulder スケールから
 * 各部位の半径・長さ・間隔を算出する純粋関数)をノードグラフへ配線するノード。
 * `garmentPlacement` が同じ純粋関数を内部で呼んでアンカー座標を計算しているのと同じ考え方 —
 * 「どうスケール計算するか」という式そのものは他ガーメントの build*Geometry の内部計算と
 * 同様にコード側に残し、「どの値がどのジェネレーターへ渡るか」という配線をノードグラフ上で
 * 可視化する(ルート CLAUDE.md 参照)。`bodyGroup`(`bodyGroupNode.ts`)内部で
 * `bodyLayout`(Y座標の算出、`bodyLayout.ts`)や各パーツの generator ノードへ出力を渡す。 */
registerNodeType({
  type: 'bodyDimensions',
  label: 'Body Dimensions',
  category: 'generator',
  inputs: [
    { id: 'heightScale', label: 'Height Scale', type: 'number' },
    { id: 'buildScale', label: 'Build Scale', type: 'number' },
    { id: 'shoulderScale', label: 'Shoulder Scale', type: 'number' },
  ],
  outputs: [
    { id: 'legHeight', label: 'Leg Height', type: 'number' },
    { id: 'legRadius', label: 'Leg Radius', type: 'number' },
    { id: 'legSpacing', label: 'Leg Spacing', type: 'number' },
    { id: 'torsoLength', label: 'Torso Length', type: 'number' },
    { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
    { id: 'headRadius', label: 'Head Radius', type: 'number' },
    { id: 'armLength', label: 'Arm Length', type: 'number' },
    { id: 'armRadius', label: 'Arm Radius', type: 'number' },
    { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number' },
  ],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const heightScale = asNumber(inputs.heightScale, 1);
    const buildScale = asNumber(inputs.buildScale, 1);
    const shoulderScale = asNumber(inputs.shoulderScale, 1);
    const d = computeBodyDimensions({ heightScale, buildScale, shoulderScale });
    return Object.fromEntries(
      Object.entries(d).map(([key, value]) => [key, { type: 'number', value } satisfies SocketValue]),
    );
  },
});
