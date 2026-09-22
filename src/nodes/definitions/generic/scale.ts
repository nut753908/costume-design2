import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を X/Y/Z の3軸方向へ非一様スケールする汎用ノード。`translate` と対になる形で
 * 3軸すべてを入力ソケットとして持つが、平行移動と違い拡大縮小のため、未接続時のフォール
 * バックはスケールなしを表す `1` になる(`translate` の未接続時 `0` と対照的)。
 * `shoesGroupNode.ts` が、つま先方向に伸びた靴らしい楕円形のシルエットを作るため Z だけ
 * 配線して使う。 */
registerNodeType({
  type: 'scale',
  label: 'Scale',
  category: 'geometry-op',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'x', label: 'X', type: 'number', default: 1 },
    { id: 'y', label: 'Y', type: 'number', default: 1 },
    { id: 'z', label: 'Z', type: 'number', default: 1 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const x = asNumber(inputs.x, 1);
    const y = asNumber(inputs.y, 1);
    const z = asNumber(inputs.z, 1);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().scale(x, y, z) } };
  },
});
