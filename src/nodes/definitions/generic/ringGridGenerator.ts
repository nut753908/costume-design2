import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asEnum, asNumber } from '../../socketHelpers';
import { buildRingGridGeometry } from '../../../geometry/ringGrid';
import type { NecklineType } from '../../../geometry/neckline';

export interface RingGridGeneratorData extends Record<string, unknown> {
  segments?: number;
  necklineType?: NecklineType;
  necklineDepth?: number;
}

/** `points`(`easedLatheProfile` が出力する、`latheGenerator` と同じ下→上の順の点列)を
 * 受け取り、`geometry/ringGrid.ts` の `buildRingGridGeometry()` で最上段のリングにだけ
 * ネックラインを彫り込んだ手組みのチューブを作る。`latheGenerator` の放射非対称版
 * (ネックラインの落ち込みは Lathe では表現できない)で、top/dress が使う。プロファイルは
 * 上(肩)から下(裾)の順へ並べ直してから渡す。`segments` は `latheGenerator` と同じく
 * 未接続なら `data` の値を使い、3 未満に丸まらないようクランプする。 */
registerNodeType<RingGridGeneratorData>({
  type: 'ringGridGenerator',
  label: 'Ring Grid',
  category: 'generator',
  inputs: [
    { id: 'points', label: 'Points', type: 'points' },
    { id: 'segments', label: 'Segments', type: 'number' },
    { id: 'necklineType', label: 'Neckline', type: 'enum' },
    { id: 'necklineDepth', label: 'Neckline Depth', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 24, necklineType: 'round', necklineDepth: 0.12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.points || inputs.points.type !== 'points') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24)));
    const necklineType = asEnum<NecklineType>(inputs.necklineType, data.necklineType ?? 'round');
    const necklineDepth = asNumber(inputs.necklineDepth, data.necklineDepth ?? 0.12);
    const rows = inputs.points.value
      .slice()
      .reverse()
      .map((p) => ({ radius: p.x, y: p.y }));
    return { geometry: { type: 'geometry', value: buildRingGridGeometry(rows, segments, necklineType, necklineDepth) } };
  },
});
