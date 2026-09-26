import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** geometry を X=0 の平面に対して鏡像反転する汎用ノード。`mirrorPair`(グループノード、
 * `mirrorPair.ts`)が +側のコピーを反転して -側を作るために使う。X を反転すると三角形の巻き順が
 * 逆になり裏面向き(FrontSide のカリングで手前の面が消える)になるため、各三角形の2頂点を入れ替えて補正する
 * (インデックス付きならインデックス、インデックス無しなら全頂点属性の該当頂点)。 */
registerNodeType({
  type: 'mirrorX',
  label: 'Mirror X',
  category: 'geometry-op',
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
    } else {
      for (const attr of Object.values(mirrored.attributes)) {
        for (let v = 0; v + 2 < attr.count; v += 3) {
          for (let c = 0; c < attr.itemSize; c++) {
            const t = attr.getComponent(v + 1, c);
            attr.setComponent(v + 1, c, attr.getComponent(v + 2, c));
            attr.setComponent(v + 2, c, t);
          }
        }
      }
    }
    return { geometry: { type: 'geometry', value: mirrored } };
  },
});
