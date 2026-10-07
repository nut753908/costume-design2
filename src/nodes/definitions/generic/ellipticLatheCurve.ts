import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { EllipticLatheCurve } from '../../../geometry/latheProfile';

/** `geometry/latheProfile.ts` の `EllipticLatheCurve` を薄くラップし、アンカー側から反対側の端まで
 * 楕円の 1/4 で結ぶ曲線(アンカー側で水平、反対端で垂直)を出力する汎用ノード。入出力と使い方は
 * `easedLatheCurve` と同じ(`Curve Up`/`Curve Down` のどちらを配線するかで向きを選ぶ)。 */
registerNodeType({
  type: 'ellipticLatheCurve',
  label: 'Elliptic Lathe Curve',
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
      up: { type: 'curve', value: new EllipticLatheCurve(startRadius, endRadius, distance, 'up') },
      down: { type: 'curve', value: new EllipticLatheCurve(startRadius, endRadius, distance, 'down') },
    };
  },
});
