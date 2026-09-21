import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を Z方向にだけ平行移動する旧ノード。保存済みグラフの内部データに残っている旧ノードタイプを評価できるまま登録しておくためだけに残している(パレットには出さない)。新しく使うのは `translate`(`translate.ts`)。 */
registerNodeType({
  type: 'translateZ',
  label: 'Translate Z',
  category: 'geometry-op',
  hiddenInPalette: true,
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'z', label: 'Z', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const z = asNumber(inputs.z, 0);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().translate(0, 0, z) } };
  },
});
