import * as THREE from 'three';
import { expect } from 'vitest';

/**
 * 三角形の巻き順が、指定した回転軸に対して外向き(FrontSide で正しく可視化される向き)に
 * なっているかを検証するテストヘルパー。巻き順が逆になると手前の面がカリングで消え、形が欠けて
 * 見える(`geometry/CLAUDE.md` 参照)が、目視では原因が巻き順だと気づきにくいため、数値で
 * 検知できるようにしておく。
 *
 * axisPoint は各三角形の重心に最も近い回転軸上の点を返す関数(第2引数はその三角形の開始
 * インデックス位置、第3引数は index 配列全体の長さ)。既定は Y軸(x=0, z=0)を軸とする形状
 * (skirt/top/hat など)向け。左右に平行移動されたジオメトリ(pants/gloves/shoes の鏡像ペア
 * など)や、Y軸以外の軸を持つ形状(sleeve の斜めのチューブなど)には、呼び出し側で対応する
 * axisPoint を渡す。鏡像ペアでは、片側の半径が offset より大きいと2つの軸の勢力圏が
 * 重心の X座標だけでは判別できずに重なることがあるため、重心ではなく index 配列上の位置
 * (前半/後半のどちらの build() 呼び出し由来か)で左右を判定するとよい。
 */
export function expectOutwardWinding(
  geometry: THREE.BufferGeometry,
  axisPoint: (centroid: THREE.Vector3, triangleStartIndex: number, totalIndexCount: number) => THREE.Vector3 = (
    c,
  ) => new THREE.Vector3(0, c.y, 0),
): void {
  const index = geometry.getIndex();
  expect(index).not.toBeNull();

  const pos = geometry.getAttribute('position');
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let outward = 0;
  let inward = 0;

  for (let i = 0; i < index!.count; i += 3) {
    a.fromBufferAttribute(pos, index!.getX(i));
    b.fromBufferAttribute(pos, index!.getX(i + 1));
    c.fromBufferAttribute(pos, index!.getX(i + 2));

    const faceNormal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const centroid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    const radial = centroid.clone().sub(axisPoint(centroid, i, index!.count));
    if (radial.lengthSq() < 1e-10) continue; // 軸上に極めて近い縮退三角形はスキップ

    radial.normalize();
    if (faceNormal.dot(radial) > 0) outward++;
    else inward++;
  }

  expect(outward).toBeGreaterThan(0);
  expect(inward).toBe(0);
}
