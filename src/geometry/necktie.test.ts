import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildNecktieGeometry } from './necktie';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = {
  knotWidth: 0.05,
  knotHeight: 0.04,
  knotThickness: 0.025,
  bladeTopWidth: 0.035,
  bladeBottomWidth: 0.06,
  bladeThickness: 0.008,
  bladeLength: 0.4,
  frontDepth: 0.3,
} as const;

describe('buildNecktieGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildNecktieGeometry(BASE);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = geometry.getAttribute('position').array as Float32Array;
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('bladeLength が長くなるほど下方向に伸びる', () => {
    const short = buildNecktieGeometry({ ...BASE, bladeLength: 0.2 });
    const long = buildNecktieGeometry({ ...BASE, bladeLength: 0.8 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('bladeBottomWidth が大きくなるほど下端側が広がる', () => {
    const narrow = buildNecktieGeometry({ ...BASE, bladeBottomWidth: 0.04 });
    const wide = buildNecktieGeometry({ ...BASE, bladeBottomWidth: 0.15 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('結び目(knot)はネックライン付近(y=0近く)にあり、ブレードはその下に垂れる', () => {
    const geometry = buildNecktieGeometry(BASE);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.y).toBeLessThanOrEqual(0);
    expect(geometry.boundingBox!.min.y).toBeLessThan(-BASE.knotHeight);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    // ブレードは(キャップの無い)チューブなので全面が Y軸からの放射方向で判定できるが、
    // 結び目(BoxGeometry)は上面・下面を持つため、Y軸基準の放射方向では底面/上面の判定が
    // 意味を持たない(法線がほぼ ±Y なのに対して放射方向はほぼ XZ 平面内になる)。
    // bag.test.ts と同様、結び目は自身の中心点を基準に判定する。
    const knotCenter = new THREE.Vector3(0, -BASE.knotHeight / 2, BASE.frontDepth);
    const KNOT_INDEX_COUNT = 36; // BoxGeometry は既定で6面×2三角形×3 = 36 indices

    expectOutwardWinding(buildNecktieGeometry(BASE), (centroid, i) =>
      i < KNOT_INDEX_COUNT ? knotCenter : new THREE.Vector3(0, centroid.y, BASE.frontDepth),
    );
  });

  it('厚みが増えるほどZ方向の広がりが増える', () => {
    const thin = buildNecktieGeometry({ ...BASE, bladeThickness: 0.005, knotThickness: 0.01 });
    const thick = buildNecktieGeometry({ ...BASE, bladeThickness: 0.05, knotThickness: 0.05 });
    thin.computeBoundingBox();
    thick.computeBoundingBox();
    const thinSize = new THREE.Vector3();
    const thickSize = new THREE.Vector3();
    thin.boundingBox!.getSize(thinSize);
    thick.boundingBox!.getSize(thickSize);
    expect(thickSize.z).toBeGreaterThan(thinSize.z);
  });
});
