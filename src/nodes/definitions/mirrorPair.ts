import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asNumber } from '../socketHelpers';
import { buildMirroredPairGeometry } from '../../geometry/mirrorPair';

/** 受け取った1つの geometry を複製し、±offset だけ X方向に離して1つの左右対称なペアへ
 * まとめる汎用ノード(`translateY` と同じ「geometry を受け取って加工した geometry を返す」
 * 形の変換ノード)。gloves/shoes/socks が `geometry/mirrorPair.ts` の
 * `buildMirroredPairGeometry(build, offset)` を build() コールバック経由で直接呼んでいるのに
 * 対し、こちらはノードグラフ上に既に存在する1つの geometry を受け取ってそのまま
 * `() => inputGeometry.clone()` を build() として渡すだけ — build() は呼ばれるたびに
 * 独立したジオメトリを返す必要がある(`buildMirroredPairGeometry` が左右それぞれを
 * 独立に平行移動するため)ので、同じ入力を毎回 clone() してから渡す。
 * `bodyLimbGroupNode.ts` が腕/脚1組の生成に使う。 */
registerNodeType({
  type: 'mirrorPair',
  label: 'Mirror Pair',
  category: 'generator',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'offset', label: 'Offset', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const geometry = inputs.geometry.value;
    const offset = asNumber(inputs.offset, 0);
    return { geometry: { type: 'geometry', value: buildMirroredPairGeometry(() => geometry.clone(), offset) } };
  },
});
