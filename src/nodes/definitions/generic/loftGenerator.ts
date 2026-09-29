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
 * `backProfile` を繋ぐと、`depthProfile` は前(+Z)側だけ、`backProfile` は後ろ(-Z)側だけの半径になり、
 * 断面は前後で別々の楕円の半分ずつを合わせた形になる(前後の厚みや中心のずれ、後頭部の張り出しや
 * 足の突き出しのような前後非対称の形を、負の値を使わずに表せる)。未接続なら前後とも `depthProfile`。
 * 曲線は同じ高さの範囲を持つこと(同じ `t` で同じ高さを指すこと)を前提にする。 */
registerNodeType<LoftGeneratorData>({
  type: 'loftGenerator',
  label: 'Loft',
  category: 'primitive',
  inputs: [
    { id: 'profile', label: 'Profile (X)', type: 'curve' },
    { id: 'depthProfile', label: 'Depth Profile (Z, front)', type: 'curve' },
    { id: 'backProfile', label: 'Back Profile (Z, back)', type: 'curve' },
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
      const ratioOf = (curve: THREE.Curve<THREE.Vector2>) =>
        curve.getPoints(steps).map((depthPoint, i) => (points[i].x > 1e-9 ? Math.max(0, depthPoint.x) / points[i].x : 1));
      const frontRatios = ratioOf(inputs.depthProfile.value);
      const backRatios = inputs.backProfile?.type === 'curve' ? ratioOf(inputs.backProfile.value) : frontRatios;
      const position = geometry.getAttribute('position');
      // LatheGeometry の頂点は「セグメント(周方向)ごとに、輪郭の点を下から順に」並ぶ。
      for (let i = 0; i < position.count; i++) {
        const ring = i % points.length;
        position.setZ(i, position.getZ(i) * (position.getZ(i) >= 0 ? frontRatios[ring] : backRatios[ring]));
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
