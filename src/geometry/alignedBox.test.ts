import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildAlignedBox } from './alignedBox';
import { expectOutwardWinding } from './windingTestHelpers';

describe('buildAlignedBox', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildAlignedBox(0.05, 0.02, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0));
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);

    const pos = geometry.getAttribute('position').array as Float32Array;
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  const cases: [string, THREE.Vector3, THREE.Vector3][] = [
    ['真下', new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)],
    ['真横', new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
    ['斜め', new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)],
    ['任意の2点', new THREE.Vector3(0.2, 0.5, -0.3), new THREE.Vector3(-0.4, -0.6, 0.1)],
  ];

  it.each(cases)('start から end までの距離ぶんの長さを持つ(%s)', (_label, start, end) => {
    const geometry = buildAlignedBox(0.02, 0.01, start, end);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const dirNorm = direction.clone().normalize();

    // 「箱の長さ方向の全長」を、start→end 方向への全頂点の投影(内積)の範囲として測る。
    const pos = geometry.getAttribute('position');
    let minT = Infinity;
    let maxT = -Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).sub(start);
      const t = v.dot(dirNorm);
      minT = Math.min(minT, t);
      maxT = Math.max(maxT, t);
    }

    expect(maxT - minT).toBeCloseTo(length, 5);
    expect(minT).toBeCloseTo(0, 5);
    expect(maxT).toBeCloseTo(length, 5);
  });

  it('start と end の中点を中心に配置される', () => {
    const start = new THREE.Vector3(0.1, 0.2, 0.3);
    const end = new THREE.Vector3(0.5, -0.4, 0.1);
    const geometry = buildAlignedBox(0.02, 0.01, start, end);
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox!.getCenter(center);
    const expectedCenter = start.clone().add(end).multiplyScalar(0.5);

    expect(center.x).toBeCloseTo(expectedCenter.x, 5);
    expect(center.y).toBeCloseTo(expectedCenter.y, 5);
    expect(center.z).toBeCloseTo(expectedCenter.z, 5);
  });

  it('width/thickness が大きくなるほど断面が太くなる', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, -1, 0);
    const thin = buildAlignedBox(0.02, 0.01, start, end);
    const thick = buildAlignedBox(0.1, 0.05, start, end);
    thin.computeBoundingBox();
    thick.computeBoundingBox();

    const thinSize = new THREE.Vector3();
    const thickSize = new THREE.Vector3();
    thin.boundingBox!.getSize(thinSize);
    thick.boundingBox!.getSize(thickSize);

    expect(thickSize.x).toBeGreaterThan(thinSize.x);
    expect(thickSize.z).toBeGreaterThan(thinSize.z);
  });

  it.each(cases)(
    '回転・平行移動のみの剛体変換のため、任意の向きでも外向きの巻き順が保たれる(%s)',
    (_label, start, end) => {
      const geometry = buildAlignedBox(0.02, 0.01, start, end);
      const center = start.clone().add(end).multiplyScalar(0.5);
      expectOutwardWinding(geometry, () => center);
    },
  );
});
