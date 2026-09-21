import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を X/Y/Z の3軸方向へ平行移動する汎用ノード。動かさない軸は未接続のままにする
 * (入力欄の既定値 0)。 */
registerNodeType({
  type: 'translate',
  label: 'Translate',
  category: 'geometry-op',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'x', label: 'X', type: 'number', default: 0 },
    { id: 'y', label: 'Y', type: 'number', default: 0 },
    { id: 'z', label: 'Z', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const x = asNumber(inputs.x, 0);
    const y = asNumber(inputs.y, 0);
    const z = asNumber(inputs.z, 0);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().translate(x, y, z) } };
  },
});
