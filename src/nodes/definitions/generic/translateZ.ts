import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

/** geometry を Z方向にだけ平行移動する汎用ノード。`translateX`/`translateY` と対になる
 * 3本目の軸版で、`translateX`(X)→`translateY`(Y)→`translateZ`(Z)と3つ繋げば任意の
 * 3軸平行移動をノードグラフ上に展開できる(現時点ではまだこの組み合わせをデフォルトの
 * グラフへ配線している箇所は無い — `torusGenerator`/`boxGenerator` と同じく、`bag.ts`/
 * `scarf.ts`/`glasses.ts` の `.translate(x,y,z)` をノード化する際に使う想定、
 * `geometry/CLAUDE.md` 参照)。 */
registerNodeType({
  type: 'translateZ',
  label: 'Translate Z',
  category: 'geometry-op',
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
