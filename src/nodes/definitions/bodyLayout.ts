import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';
import { computeBodyLayout } from '../../geometry/body';

/** `geometry/body.ts` の `computeBodyLayout()`(各部位の寸法から、脚/胴体/頭/腕を積み上げた
 * 実際の Y座標を算出する純粋関数)をノードグラフへ配線するノード。`bodyDimensions` ノードの
 * 出力(スケール後の寸法)をそのまま受け取り、`bodyGroup` 内の各 `translateY` ノードへ
 * パーツの中心Y座標を渡す — `computeBodyLayout(d: BodyDimensions)` は本来9フィールドを
 * 受け取るが、実際に使うのはこの5つ(legHeight/torsoLength/torsoRadius/headRadius/
 * armLength)だけなので、入力ソケットもこの5つに絞っている(他の4フィールドは Y座標の
 * 算出に使われない)。legRadius/legSpacing/armRadius/shoulderSpacing は generator ノードへ
 * `bodyDimensions` から直接配線され、ここを経由しない。 */
registerNodeType({
  type: 'bodyLayout',
  label: 'Body Layout',
  category: 'generator',
  inputs: [
    { id: 'legHeight', label: 'Leg Height', type: 'number' },
    { id: 'torsoLength', label: 'Torso Length', type: 'number' },
    { id: 'torsoRadius', label: 'Torso Radius', type: 'number' },
    { id: 'headRadius', label: 'Head Radius', type: 'number' },
    { id: 'armLength', label: 'Arm Length', type: 'number' },
  ],
  outputs: [
    { id: 'legCenterY', label: 'Leg Center Y', type: 'number' },
    { id: 'torsoCenterY', label: 'Torso Center Y', type: 'number' },
    { id: 'headCenterY', label: 'Head Center Y', type: 'number' },
    { id: 'armCenterY', label: 'Arm Center Y', type: 'number' },
  ],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const legHeight = asNumber(inputs.legHeight, 0.85);
    const torsoLength = asNumber(inputs.torsoLength, 0.55);
    const torsoRadius = asNumber(inputs.torsoRadius, 0.26);
    const headRadius = asNumber(inputs.headRadius, 0.16);
    const armLength = asNumber(inputs.armLength, 0.62);

    // legRadius/legSpacing/armRadius/shoulderSpacing は computeBodyLayout() の計算に
    // 使われないため、ダミー値(0)で十分。
    const layout = computeBodyLayout({
      legHeight,
      legRadius: 0,
      legSpacing: 0,
      torsoLength,
      torsoRadius,
      headRadius,
      armLength,
      armRadius: 0,
      shoulderSpacing: 0,
    });

    return {
      legCenterY: { type: 'number', value: layout.legCenterY },
      torsoCenterY: { type: 'number', value: layout.torsoCenterY },
      headCenterY: { type: 'number', value: layout.headCenterY },
      armCenterY: { type: 'number', value: layout.armCenterY },
    };
  },
});
