import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';

/** geometry を X方向にだけ平行移動する汎用ノード。`translateY` と対になる、左右対称ペアを
 * 組み立てる `mirrorPair`(グループノード、`mirrorPair.ts`)専用の部品。 */
registerNodeType({
  type: 'translateX',
  label: 'Translate X',
  category: 'generator',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'x', label: 'X', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const x = asNumber(inputs.x, 0);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().translate(x, 0, 0) } };
  },
});
