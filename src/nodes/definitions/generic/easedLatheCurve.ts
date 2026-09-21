import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { EasedLatheCurve } from '../../../geometry/latheProfile';

/** `geometry/latheProfile.ts` の `EasedLatheCurve` を薄くラップし、アンカー側から反対側の端まで
 * 半径をイージングしながら結ぶ曲線(`getPoint(t)` は `(半径, 高さ)`)を出力する汎用ノード。
 * `latheGenerator`(`latheGenerator.ts`)/`ringGridGenerator` へ渡すと、その `Profile Steps` 個に
 * 分割した点列から回転体になる(分割数は曲線ではなく受け取る側の設定)。
 * アンカー側から反対側へどちらのY方向に伸ばすか(skirt/pants/gloves のように腰/手首から垂れ下がる
 * 形状は `down`、shoes/hat/socks のように地面/頭から上へ伸びる形状は `up`)は、どちらの出力を配線
 * するかで選ぶ(`necklineShapes` の形の選択と同じ)。使われなかった側は評価されるだけで何にも使われない。 */
registerNodeType({
  type: 'easedLatheCurve',
  label: 'Eased Lathe Curve',
  category: 'curve',
  inputs: [
    { id: 'startRadius', label: 'Start Radius', type: 'number', default: 0 },
    { id: 'endRadius', label: 'End Radius', type: 'number', default: 0 },
    { id: 'distance', label: 'Distance', type: 'number', default: 0 },
  ],
  outputs: [
    { id: 'up', label: 'Curve Up', type: 'curve' },
    { id: 'down', label: 'Curve Down', type: 'curve' },
  ],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const startRadius = asNumber(inputs.startRadius, 0);
    const endRadius = asNumber(inputs.endRadius, 0);
    const distance = asNumber(inputs.distance, 0);
    return {
      up: { type: 'curve', value: new EasedLatheCurve(startRadius, endRadius, distance, 'up') },
      down: { type: 'curve', value: new EasedLatheCurve(startRadius, endRadius, distance, 'down') },
    };
  },
});
