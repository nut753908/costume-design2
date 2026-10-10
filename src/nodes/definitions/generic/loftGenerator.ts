import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

export interface LoftGeneratorData extends Record<string, unknown> {
  segments?: number;
  steps?: number;
  pleatCount?: number;
  scallopCount?: number;
  scallopHeight?: number;
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
 * 前後非対称の形(後頭部の張り出しや足の突き出しなど)は、前後別々の半径ではなく、`offsetZProfile` で各リングを
 * 前後へずらして表す(前後で別々の半径にすると、側面の継ぎ目に稜線が立つ)。
 * `tiltProfile`(符号付きの曲線、値は度数)を繋ぐと、各高さの輪を輪の中心まわりに前後へ傾ける(正で輪の面の法線が前(+Z)を向き、
 * 輪の後ろ側が上がり前側が下がる)。軸が斜めに曲がった部分(胴体から前へ傾く首)の輪を、軸に垂直にするためのもの。
 * `ringProfile`(`ringSpacingCurve`)を繋ぐと、輪を置く高さの割合を等間隔ではなくその曲線で決める(球の極のように曲線が
 * 急に曲がる所へ輪を密に置いて、少ない段数でなめらかな面にする)。
 * `pleatProfile`(符号付きの曲線、値は半径に対する比)を繋ぐと、周を `pleatCount` 個に分けた三角波で各高さの輪の半径を
 * 外側へだけ膨らませ、縦のプリーツ(山と谷)を付ける(山が正面)。谷が元の輪郭なので、体に沿わせた輪郭の内側へは入らない。
 * 山と谷の面がはっきり分かれるよう、`segments` はプリーツ1つあたり数本になる値にする。
 * `scallopCount`/`scallopHeight` が 0 より大きいと、上端の輪を周に `scallopCount` 個の半円の山(⋂⋂⋂)の形に持ち上げる
 * (服の上端のレースのような縁)。山の数は `segments` の約数にすると、どの山も同じ形になる。
 * 曲線は同じ高さの範囲を持つこと(同じ `t` で同じ高さを指すこと)を前提にする。 */
registerNodeType<LoftGeneratorData>({
  type: 'loftGenerator',
  label: 'Loft',
  category: 'primitive',
  inputs: [
    { id: 'profile', label: 'Profile (X)', type: 'curve' },
    { id: 'depthProfile', label: 'Depth Profile (Z, front)', type: 'curve' },
    { id: 'dropProfile', label: 'Drop Profile (Y)', type: 'curve' },
    { id: 'offsetZProfile', label: 'Offset Profile (Z)', type: 'curve' },
    { id: 'tiltProfile', label: 'Tilt Profile (deg)', type: 'curve' },
    { id: 'ringProfile', label: 'Ring Spacing', type: 'curve' },
    { id: 'pleatProfile', label: 'Pleat Depth', type: 'curve' },
    { id: 'pleatCount', label: 'Pleat Count', type: 'number', default: 16 },
    { id: 'scallopCount', label: 'Scallop Count', type: 'number', default: 0 },
    { id: 'scallopHeight', label: 'Scallop Height', type: 'number', default: 0 },
    { id: 'steps', label: 'Profile Steps', type: 'number', default: 24 },
    { id: 'segments', label: 'Segments', type: 'number', default: 24 },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({ segments: 24, steps: 24 }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    if (!inputs.profile || inputs.profile.type !== 'curve') return {};
    const segments = Math.max(3, Math.round(asNumber(inputs.segments, data.segments ?? 24)));
    const steps = Math.max(1, Math.round(asNumber(inputs.steps, data.steps ?? 24)));
    // `ringProfile`(`ringSpacingCurve`)を繋ぐと、輪の高さの割合を等間隔(`i / steps`)ではなく曲線の値にする。
    // 全プロファイル曲線を同じ割合で評価する(曲線が急に曲がる所へ輪を密に置ける)。
    const ringT = (i: number) => {
      const u = i / steps;
      return inputs.ringProfile?.type === 'curve' ? inputs.ringProfile.value.getPoint(u).x : u;
    };
    const sample = (curve: THREE.Curve<THREE.Vector2>) => Array.from({ length: steps + 1 }, (_, i) => curve.getPoint(ringT(i)));
    const points = sample(inputs.profile.value);
    const geometry = new THREE.LatheGeometry(points, segments);
    if (inputs.pleatProfile?.type === 'curve') {
      const depths = sample(inputs.pleatProfile.value).map((depthPoint) => depthPoint.x);
      const count = Math.max(1, Math.round(asNumber(inputs.pleatCount, data.pleatCount ?? 16)));
      const position = geometry.getAttribute('position');
      for (let i = 0; i < position.count; i++) {
        // LatheGeometry は x = r sin φ, z = r cos φ。三角波は φ = 0(正面)で山(1)、山と山の中間で谷(0)。
        const u = (count * Math.atan2(position.getX(i), position.getZ(i))) / (2 * Math.PI);
        const wave = Math.abs(2 * (u - Math.floor(u)) - 1);
        const factor = 1 + depths[i % points.length] * wave;
        position.setX(i, position.getX(i) * factor);
        position.setZ(i, position.getZ(i) * factor);
      }
      position.needsUpdate = true;
      if (inputs.depthProfile?.type !== 'curve') {
        geometry.computeVertexNormals();
        smoothCoincidentNormals(geometry);
      }
    }
    const scallopCount = Math.round(asNumber(inputs.scallopCount, data.scallopCount ?? 0));
    const scallopHeight = asNumber(inputs.scallopHeight, data.scallopHeight ?? 0);
    if (scallopCount > 0 && scallopHeight > 0) {
      const position = geometry.getAttribute('position');
      for (let i = points.length - 1; i < position.count; i += points.length) {
        // 上端の輪の頂点だけ。周方向の列(i / points.length)から、山の中の位置 s(0〜1)を決め、半円の高さだけ持ち上げる。
        const u = (scallopCount * Math.floor(i / points.length)) / segments;
        const s = u - Math.floor(u);
        position.setY(i, position.getY(i) + scallopHeight * Math.sqrt(Math.max(0, 1 - (2 * s - 1) ** 2)));
      }
      position.needsUpdate = true;
      if (inputs.depthProfile?.type !== 'curve') {
        geometry.computeVertexNormals();
        smoothCoincidentNormals(geometry);
      }
    }
    if (inputs.depthProfile?.type === 'curve') {
      const ratioOf = (curve: THREE.Curve<THREE.Vector2>) =>
        sample(curve).map((depthPoint, i) => (points[i].x > 1e-9 ? Math.max(0, depthPoint.x) / points[i].x : 1));
      const ratios = ratioOf(inputs.depthProfile.value);
      const position = geometry.getAttribute('position');
      // LatheGeometry の頂点は「セグメント(周方向)ごとに、輪郭の点を下から順に」並ぶ。
      // `dropProfile` の値(曲線の x)だけ、各高さの輪を丸ごと下げる(頭の下面のように、輪の形は保ったまま高さだけを
      // ずらす)。極の頂点も含めて全周を同じ量だけ動かすので、前後の境目やしわは出ない。
      const drops = inputs.dropProfile?.type === 'curve' ? sample(inputs.dropProfile.value).map((dropPoint) => dropPoint.x) : null;
      // `offsetZProfile` の値(曲線の x、符号付き)だけ、各高さの輪を丸ごと前(+Z)へずらす。前後を別々の半径にせず
      // 1つの楕円のまま前後非対称の形を表せるので、前後の継ぎ目に稜線(エッジ)ができない。
      const offsets =
        inputs.offsetZProfile?.type === 'curve' ? sample(inputs.offsetZProfile.value).map((offsetPoint) => offsetPoint.x) : null;
      // `tiltProfile` の値(度)だけ、各高さの輪を輪の中心まわりに X 軸方向へ傾ける。
      const tilts =
        inputs.tiltProfile?.type === 'curve'
          ? sample(inputs.tiltProfile.value).map((tiltPoint) => (tiltPoint.x * Math.PI) / 180)
          : null;
      for (let i = 0; i < position.count; i++) {
        const ring = i % points.length;
        const depth = position.getZ(i) * ratios[ring];
        if (drops) position.setY(i, position.getY(i) - drops[ring]);
        if (tilts) {
          position.setY(i, position.getY(i) - depth * Math.sin(tilts[ring]));
          position.setZ(i, depth * Math.cos(tilts[ring]) + (offsets ? offsets[ring] : 0));
        } else position.setZ(i, depth + (offsets ? offsets[ring] : 0));
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      smoothCoincidentNormals(geometry);
    }
    return { geometry: { type: 'geometry', value: geometry } };
  },
});
