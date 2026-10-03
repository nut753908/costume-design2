import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface LoftGeneratorData extends Record<string, unknown> {
  segments?: number;
  steps?: number;
}

/** 位置が重なる頂点(回転体の始点と終点の継ぎ目、極)の法線を平均し、継ぎ目に縦の筋(陰影の段差)が出ないようにする。
 * `computeVertexNormals()` は共有されていない頂点ごとに法線を求めるので、継ぎ目の両側で法線が食い違う。 */
function smoothCoincidentNormals(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const groups = new Map<string, number[]>();
  // -0 と 0 が別のキーにならないよう `+ 0` で正規化し、丸め誤差は 1e-5 で吸収する。
  const round = (v: number) => (Math.round(v * 1e5) / 1e5 + 0).toFixed(5);
  for (let i = 0; i < position.count; i++) {
    const key = `${round(position.getX(i))},${round(position.getY(i))},${round(position.getZ(i))}`;
    const group = groups.get(key);
    if (group) group.push(i);
    else groups.set(key, [i]);
  }
  const sum = new THREE.Vector3();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    sum.set(0, 0, 0);
    for (const i of group) {
      sum.x += normal.getX(i);
      sum.y += normal.getY(i);
      sum.z += normal.getZ(i);
    }
    sum.normalize();
    for (const i of group) normal.setXYZ(i, sum.x, sum.y, sum.z);
  }
  normal.needsUpdate = true;
}

/** `profile`(幅方向 X の半径）と `depthProfile`(前後方向 Z の半径)の2つの `(半径, 高さ)` の曲線から、
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
    { id: 'dropProfile', label: 'Drop Profile (Y)', type: 'curve' },
    { id: 'offsetZProfile', label: 'Offset Profile (Z)', type: 'curve' },
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
      // `dropProfile` の値(曲線の x)だけ、各高さの輪を丸ごと下げる(頭の下面のように、輪の形は保ったまま高さだけを
      // ずらす)。極の頂点も含めて全周を同じ量だけ動かすので、前後の境目やしわは出ない。
      const drops = inputs.dropProfile?.type === 'curve' ? inputs.dropProfile.value.getPoints(steps).map((dropPoint) => dropPoint.x) : null;
      // `offsetZProfile` の値(曲線の x、符号付き)だけ、各高さの輪を丸ごと前(+Z)へずらす。前後を別々の半径にせず
      // 1つの楕円のまま前後非対称の形を表せるので、前後の継ぎ目に稜線(エッジ)ができない。
      const offsets =
        inputs.offsetZProfile?.type === 'curve' ? inputs.offsetZProfile.value.getPoints(steps).map((offsetPoint) => offsetPoint.x) : null;
      for (let i = 0; i < position.count; i++) {
        const ring = i % points.length;
        if (drops) position.setY(i, position.getY(i) - drops[ring]);
        const z = position.getZ(i);
        position.setZ(i, z * (z >= 0 ? frontRatios[ring] : backRatios[ring]) + (offsets ? offsets[ring] : 0));
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      smoothCoincidentNormals(geometry);
    }
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
