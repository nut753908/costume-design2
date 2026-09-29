import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を原点まわりに X → Y → Z の順で回転する汎用ノード。角度は度数で、動かさない軸は
 * 未接続のままにする(入力欄の既定値 0)。`limbPair` が腕/脚を付け根で外へ振るのに使う。 */
registerNodeType({
  type: 'rotate',
  label: 'Rotate',
  category: 'geometry-op',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'x', label: 'X (deg)', type: 'number', default: 0 },
    { id: 'y', label: 'Y (deg)', type: 'number', default: 0 },
    { id: 'z', label: 'Z (deg)', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const toRad = Math.PI / 180;
    const geometry = inputs.geometry.value.clone();
    geometry.rotateX(asNumber(inputs.x, 0) * toRad);
    geometry.rotateY(asNumber(inputs.y, 0) * toRad);
    geometry.rotateZ(asNumber(inputs.z, 0) * toRad);
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
