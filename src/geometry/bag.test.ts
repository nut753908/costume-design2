import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildBagGeometry } from './bag';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = {
  strapWidth: 0.04,
  strapThickness: 0.015,
  shoulderOffset: 0.08,
  hipOffset: 0.12,
  drop: 0.55,
  bagWidth: 0.16,
  bagHeight: 0.14,
  bagDepth: 0.08,
} as const;

// THREE.BoxGeometry は既定で6面×2三角形=36 indices の固定サイズ。mergeGeometries は
// 渡した順(strap → bag)に index を連結するため、前半36個がストラップ、残りがバッグ本体。
const STRAP_INDEX_COUNT = 36;

describe('buildBagGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildBagGeometry(BASE);
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

  it('ストラップとバッグ本体、2つの箱ぶんの頂点を持つ', () => {
    const geometry = buildBagGeometry(BASE);
    // BoxGeometry は既定で24頂点(面ごとに頂点を共有しない)。2つ分で48。
    expect(geometry.getAttribute('position').count).toBe(48);
  });

  it('drop が大きくなるほどバッグ本体が下方向に垂れる', () => {
    const short = buildBagGeometry({ ...BASE, drop: 0.2 });
    const long = buildBagGeometry({ ...BASE, drop: 0.8 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('hipOffset が大きくなるほど反対側(-X方向)へ広がる', () => {
    const narrow = buildBagGeometry({ ...BASE, hipOffset: 0.05 });
    const wide = buildBagGeometry({ ...BASE, hipOffset: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.min.x).toBeLessThan(narrow.boundingBox!.min.x);
  });

  it('bagWidth/bagHeight/bagDepth が大きくなるほどバッグ本体の寸法が広がる', () => {
    const small = buildBagGeometry({ ...BASE, bagWidth: 0.05, bagHeight: 0.05, bagDepth: 0.05 });
    const large = buildBagGeometry({ ...BASE, bagWidth: 0.4, bagHeight: 0.4, bagDepth: 0.4 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    const smallSize = new THREE.Vector3();
    const largeSize = new THREE.Vector3();
    small.boundingBox!.getSize(smallSize);
    large.boundingBox!.getSize(largeSize);
    expect(largeSize.x).toBeGreaterThan(smallSize.x);
    expect(largeSize.y).toBeGreaterThan(smallSize.y);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    // ストラップ/バッグ本体はそれぞれ凸な箱なので、各パーツ自身の中心を基準に外向きかどうかを
    // 判定できる(gloves.test.ts などの左右ペアでの index 位置による判定と同じ考え方)。
    const strapStart = new THREE.Vector3(BASE.shoulderOffset, 0, 0.05);
    const strapEnd = new THREE.Vector3(-BASE.hipOffset, -BASE.drop, 0.18);
    const strapCenter = strapStart.clone().add(strapEnd).multiplyScalar(0.5);
    const bagCenter = strapEnd.clone().add(new THREE.Vector3(0, -BASE.bagHeight / 2, 0));

    expectOutwardWinding(buildBagGeometry(BASE), (_centroid, i) =>
      i < STRAP_INDEX_COUNT ? strapCenter : bagCenter,
    );
  });
});
