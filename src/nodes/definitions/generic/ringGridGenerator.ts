import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildRingGridGeometry } from '../../../geometry/ringGrid';

export interface RingGridGeneratorData extends Record<string, unknown> {
  segments?: number;
  necklineDepth?: number;
}

/** `points`(`easedLatheProfile` が出力する、`latheGenerator` と同じ下→上の順の点列)を
 * 受け取り、`geometry/ringGrid.ts` の `buildRingGridGeometry()` で最上段のリングにだけ
 * ネックラインを彫り込んだ手組みのチューブを作る。`necklineWeights` は正面からの角度(0〜1に
 * 正規化)に対する落ち込み量の点列(x=角度、y=重み、`geometry/neckline.ts` 参照)。`latheGenerator` の放射非対称版
 * (ネックラインの落ち込みは Lathe では表現できない)で、top/dress が使う。プロファイルは
 * 上(肩)から下(裾)の順へ並べ直してから渡す。`segments` は `latheGenerator` と同じく
 * 未接続なら `data` の値を使い、3 未満に丸まらないようクランプする。 */
registerNodeType<RingGridGeneratorData>({
  type: 'ringGridGenerator',
  label: 'Ring Grid',
  category: 'primitive',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'segments', label: 'Segments', type: 'number', default: 24 },
    { id: 'necklineWeights', label: 'Neckline', type: 'points' },
    { id: 'necklineDepth', label: 'Neckline Depth', type: 'number', default: 0.12 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 24, necklineDepth: 0.12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24)));
    // 未接続ならネックラインを彫り込まない(形はノード構成で選ぶ。`generic/necklineShapes.ts` の `necklineShapes` グループ)。
    const necklineWeights = inputs.necklineWeights?.type === 'points' ? inputs.necklineWeights.value : [];
    const necklineDepth = asNumber(inputs.necklineDepth, data.necklineDepth ?? 0.12);
    const rows = inputs.points.value
      .slice()
      .reverse()
      .map((p) => ({ radius: p.x, y: p.y }));
    return { geometry: { type: 'geometry', value: buildRingGridGeometry(rows, segments, necklineWeights, necklineDepth) } };
  },
});
