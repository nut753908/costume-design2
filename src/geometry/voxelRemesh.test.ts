import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { voxelRemesh } from './voxelRemesh';

const PARAMS = { yMin: -1, yMax: 1, xMax: 1, voxelSize: 0.05, sigma: 2, iso: 0.45, overlap: 0.1 };

/** 閉じたメッシュの符号付き体積(外向きの巻き順なら正)。 */
function signedVolume(g: THREE.BufferGeometry): number {
  const p = g.getAttribute('position');
  const idx = g.index!;
  let v = 0;
  for (let f = 0; f < idx.count; f += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, idx.getX(f));
    const b = new THREE.Vector3().fromBufferAttribute(p, idx.getX(f + 1));
    const c = new THREE.Vector3().fromBufferAttribute(p, idx.getX(f + 2));
    v += a.dot(b.clone().cross(c)) / 6;
  }
  return v;
}

describe('voxelRemesh', () => {
  it('箱が球全体を含むとき、作り直した面は外向きで元の体積にほぼ等しい', () => {
    const sphere = new THREE.SphereGeometry(0.6, 32, 24);
    const out = voxelRemesh(sphere, { ...PARAMS, overlap: 0.001 });
    const expected = (4 / 3) * Math.PI * 0.6 ** 3;
    // 元の面は箱のコア(overlap 0.001 だけ内側)の外にしか残らない = ほぼ全部置き換わる
    expect(signedVolume(out)).toBeGreaterThan(expected * 0.9);
    expect(signedVolume(out)).toBeLessThan(expected * 1.1);
  });

  it('箱の外の面は元のまま残る', () => {
    const sphere = new THREE.SphereGeometry(0.6, 32, 24);
    const out = voxelRemesh(sphere, { ...PARAMS, yMin: -0.2, yMax: 0.2, xMax: 0.3, overlap: 0.02 });
    const orig = sphere.getAttribute('position');
    const o = out.getAttribute('position');
    // 元の頂点がそのまま先頭に並ぶ
    for (let i = 0; i < orig.count; i++) expect(o.getY(i)).toBeCloseTo(orig.getY(i), 6);
    expect(o.count).toBeGreaterThan(orig.count);
  });

  it('2つの球が重なる継ぎ目をなめらかにつなぐ(くびれの谷が埋まる)', () => {
    const a = new THREE.SphereGeometry(0.4, 32, 24).translate(-0.3, 0, 0);
    const b = new THREE.SphereGeometry(0.4, 32, 24).translate(0.3, 0, 0);
    a.deleteAttribute('uv');
    b.deleteAttribute('uv');
    const merged = new THREE.BufferGeometry();
    const pa = a.getAttribute('position');
    const pb = b.getAttribute('position');
    const arr = [...pa.array, ...pb.array];
    merged.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const ia = Array.from(a.index!.array);
    merged.setIndex([...ia, ...Array.from(b.index!.array, (i) => i + pa.count)]);
    const out = voxelRemesh(merged, { ...PARAMS, overlap: 0.001 });
    out.computeBoundingBox();
    expect(out.boundingBox!.max.x).toBeLessThanOrEqual(0.72);
    expect(out.boundingBox!.max.x).toBeGreaterThan(0.6);
    expect(signedVolume(out)).toBeGreaterThan(0);
  });

  it('箱の縁に近い作り直した頂点は、元の面の上に寄る(境目に段差を作らない)', () => {
    const sphere = new THREE.SphereGeometry(0.6, 48, 32);
    const out = voxelRemesh(sphere, { ...PARAMS, yMin: -0.3, yMax: 0.3, xMax: 1, overlap: 0.04 });
    const p = out.getAttribute('position');
    let checked = 0;
    for (let i = sphere.getAttribute('position').count; i < p.count; i++) {
      if (Math.abs(p.getY(i) - 0.3) > 0.01) continue;
      // 元の球は多角形近似なので、半径 0.6 から球面の弦の分(約 2mm)までのずれは許す
      expect(Math.abs(Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) - 0.6)).toBeLessThan(0.004);
      checked++;
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('頂点が無い・箱が空のときは何もしない(複製を返す)', () => {
    const empty = new THREE.BufferGeometry();
    expect(voxelRemesh(empty, PARAMS)).not.toBe(empty);
    const sphere = new THREE.SphereGeometry(0.5, 8, 6);
    expect(voxelRemesh(sphere, { ...PARAMS, yMax: -2 }).getAttribute('position').count).toBe(
      sphere.getAttribute('position').count,
    );
  });
});
