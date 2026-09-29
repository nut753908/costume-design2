import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface LoftGeneratorData extends Record<string, unknown> {
  segments?: number;
  steps?: number;
}

/** `profile`(幅方向 X の半径)と `depthProfile`(前後方向 Z の半径)の2つの `(半径, 高さ)` の曲線から、
 * 断面が楕円で、高さごとに幅と奥行きが変わる回転体のような形を作る汎用ノード。`latheGenerator` と同じく
 * `profile` を `steps` 分割した点列から `THREE.LatheGeometry` を作り、各リングの Z を
 * `depthProfile の半径 / profile の半径` 倍する(巻き順は Z が正の倍率のあいだ保たれる)。
 * `depthProfile` が未接続なら円断面(= `latheGenerator` と同じ)。半径が 0 のリング(極)は Z を変えない。
 * 2つの曲線は同じ高さの範囲を持つこと(同じ `t` で同じ高さを指すこと)を前提にする。 */
registerNodeType<LoftGeneratorData>({
  type: 'loftGenerator',
  label: 'Loft',
  category: 'primitive',
  inputs: [
    { id: 'profile', label: 'Profile (X)', type: 'curve' },
    { id: 'depthProfile', label: 'Depth Profile (Z)', type: 'curve' },
    { id: 'steps', label: 'Profile Steps', type: 'number', default: 24 },
    { id: 'segments', label: 'Segments', type: 'number', default: 24 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 24, steps: 24 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.profile || inputs.profile.type !== 'curve') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24)));
    const steps = Math.max(1, Math.round(asNumber(inputs.steps, data.steps ?? 24)));
    const points = inputs.profile.value.getPoints(steps);
    const geometry = new THREE.LatheGeometry(points, segments);
    if (inputs.depthProfile?.type === 'curve') {
      const depthPoints = inputs.depthProfile.value.getPoints(steps);
      const ratios = points.map((p, i) => (p.x > 1e-9 ? Math.max(0, depthPoints[i].x) / p.x : 1));
      const position = geometry.getAttribute('position');
      // LatheGeometry の頂点は「セグメント(周方向)ごとに、輪郭の点を下から順に」並ぶ。
      for (let i = 0; i < position.count; i++) position.setZ(i, position.getZ(i) * ratios[i % points.length]);
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
