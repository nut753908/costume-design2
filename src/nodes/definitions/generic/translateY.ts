import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を Y方向にだけ平行移動する旧ノード。保存済みグラフの内部データに残っている旧ノードタイプを評価できるまま登録しておくためだけに残している(パレットには出さない)。新しく使うのは `translate`(`translate.ts`)。 */
registerNodeType({
  type: 'translateY',
  label: 'Translate Y',
  category: 'geometry-op',
  hiddenInPalette: true,
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'y', label: 'Y', type: 'number', default: 0 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const y = asNumber(inputs.y, 0);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().translate(0, y, 0) } };
  },
});
