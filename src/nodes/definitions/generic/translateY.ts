import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を Y方向にだけ平行移動する汎用ノード。`garmentPlacement` が `anchorY` と `offsetY` を足した位置へ配置するのに対し、こちらは `bodyGroupNode.ts` が胴体/頭/
 * 腕/脚の4パーツを自分自身の内部で組み立てる用で、`bodyLayoutGroupNode.ts` 内の
 * numberAdd/numberSubtract/numberMultiply チェーンが算出する実際のY座標をそのまま数値で
 * 受け取って平行移動するだけ(X/Zは常に0 — 胴体・頭は中心線上、腕・脚は `mirrorPair` が
 * 左右のX方向オフセットを既に焼き込み済み)。 */
registerNodeType({
  type: 'translateY',
  label: 'Translate Y',
  category: 'generator',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'y', label: 'Y', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};
    const y = asNumber(inputs.y, 0);
    return { geometry: { type: 'geometry', value: inputs.geometry.value.clone().translate(0, y, 0) } };
  },
});
