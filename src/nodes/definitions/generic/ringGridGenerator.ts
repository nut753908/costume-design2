import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';
import { buildRingGridGeometry } from '../../../geometry/ringGrid';

export interface RingGridGeneratorData extends Record<string, unknown> {
  segments?: number;
  steps?: number;
  necklineDepth?: number;
}

/** `profile`(`easedLatheCurve` が出力する曲線を `steps` 分割した、`latheGenerator` と同じ下→上の順の点列)を
 * 受け取り、`geometry/ringGrid.ts` の `buildRingGridGeometry()` で最上段のリングにだけ
 * ネックラインを彫り込んだ手組みのチューブを作る。`necklineWeights` は正面からの角度(0〜1に
 * 正規化)に対する落ち込み量の曲線(x=角度、y=重み、`geometry/neckline.ts` 参照)。`latheGenerator` の放射非対称版
 * (ネックラインの落ち込みは Lathe では表現できない)で、top/dress が使う。プロファイルは
 * 上(肩)から下(裾)の順へ並べ直してから渡す。`segments` は `latheGenerator` と同じく
 * 未接続なら `data` の値を使い、3 未満に丸まらないようクランプする。 */
registerNodeType<RingGridGeneratorData>({
  type: 'ringGridGenerator',
  label: 'Ring Grid',
  category: 'primitive',
  inputs: [
    { id: 'profile', label: 'Profile', type: 'curve' },
    { id: 'steps', label: 'Profile Steps', type: 'number', default: 10 },
    { id: 'segments', label: 'Segments', type: 'number', default: 24 },
    { id: 'necklineWeights', label: 'Neckline', type: 'curve' },
    { id: 'necklineDepth', label: 'Neckline Depth', type: 'number', default: 0.12 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 24, steps: 10, necklineDepth: 0.12 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.profile || inputs.profile.type !== 'curve') return {};
    const steps = Math.max(1, Math.round(asNumber(inputs.steps, data.steps ?? 10)));
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24)));
    // 未接続ならネックラインを彫り込まない(形はノード構成で選ぶ。`generic/necklineShapes.ts` の `necklineShapes` グループ)。
    const necklineWeights = inputs.necklineWeights?.type === 'curve' ? inputs.necklineWeights.value : undefined;
    const necklineDepth = asNumber(inputs.necklineDepth, data.necklineDepth ?? 0.12);
    const rows = inputs.profile.value
      .getPoints(steps)
      .reverse()
      .map((p) => ({ radius: p.x, y: p.y }));
    return { geometry: { type: 'geometry', value: buildRingGridGeometry(rows, segments, necklineWeights, necklineDepth) } };
  },
});
