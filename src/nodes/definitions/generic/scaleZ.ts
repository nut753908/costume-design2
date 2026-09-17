import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を Z方向にだけ非一様スケールする汎用ノード。`translateX`/`translateY`/
 * `translateZ` と同じ「1軸だけを扱う汎用ノード」の形だが、平行移動ではなく拡大縮小のため、
 * 未接続時のフォールバックは(平行移動の0と違い)スケールなしを表す `1` になる。
 * `shoes.ts` がつま先方向に伸びた靴らしい楕円形のシルエットを作るために `.scale(1, 1,
 * toeLength)` していた処理を、`shoesGroupNode.ts` 側のノードグラフへ展開する際に使う。 */
registerNodeType({
  type: 'scaleZ',
  label: 'Scale Z',
  category: 'generator',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'z', label: 'Z', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const z = asNumber(inputs.z, 1);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().scale(1, 1, z) } };
  },
});
