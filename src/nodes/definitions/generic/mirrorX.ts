import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** geometry を X=0 の平面に対して鏡像反転する汎用ノード。`mirrorPair`(グループノード、
 * `mirrorPair.ts`)が負側のコピーを作るために使う。X を反転すると三角形の巻き順が逆になり
 * 裏面向き(真っ黒なシルエット)になるため、各三角形の2頂点のインデックスを入れ替えて補正する。 */
registerNodeType({
  type: 'mirrorX',
  label: 'Mirror X',
  category: 'generator',
  inputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const mirrored = inputs.geometry.value.clone().scale(-1, 1, 1);
    const index = mirrored.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const b = index.getX(i + 1);
        index.setX(i + 1, index.getX(i + 2));
        index.setX(i + 2, b);
      }
    }
    return { geometry: { type: 'geometry', value: mirrored } };
  },
});
