import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildGlassesFrameGeometry, FORWARD_DEPTH, type GlassesFrameParams } from './glasses';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE: GlassesFrameParams = {
  lensRadius: 0.045,
  bridgeThickness: 0.01,
  lensSpacing: 0.055,
  templeLength: 0.12,
  templeThickness: 0.006,
};

const TEMPLE_BACK_DEPTH = FORWARD_DEPTH - 0.02;

function positions(geometry: THREE.BufferGeometry): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

// 左右のレンズ(TorusGeometry+平行移動)はこのファイルの責務ではなくなったため、
// ブリッジ/テンプルだけを検証する(レンズ側は torusGenerator.test.ts/translateX.test.ts/
// translateZ.test.ts が既にカバーしている)。
describe('buildGlassesFrameGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildGlassesFrameGeometry(BASE);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);

    const pos = positions(geometry);
    expect(pos.length).toBeGreaterThan(0);
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('lensSpacing が広がるほどブリッジ/テンプルの左右の間隔も広がる', () => {
    const narrow = buildGlassesFrameGeometry({ ...BASE, lensSpacing: 0.04 });
    const wide = buildGlassesFrameGeometry({ ...BASE, lensSpacing: 0.1 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('templeLength が長くなるほどテンプル(つる)が後方(-Z)に伸びる', () => {
    const short = buildGlassesFrameGeometry({ ...BASE, templeLength: 0.05 });
    const long = buildGlassesFrameGeometry({ ...BASE, templeLength: 0.3 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.z).toBeLessThan(short.boundingBox!.min.z);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    const bridgeCenter = new THREE.Vector3(0, 0, FORWARD_DEPTH);
    const leftTempleCenter = new THREE.Vector3(
      BASE.lensSpacing + BASE.lensRadius,
      0,
      (FORWARD_DEPTH + TEMPLE_BACK_DEPTH - BASE.templeLength) / 2,
    );
    const rightTempleCenter = new THREE.Vector3(
      -(BASE.lensSpacing + BASE.lensRadius),
      0,
      (FORWARD_DEPTH + TEMPLE_BACK_DEPTH - BASE.templeLength) / 2,
    );

    const bridgeIndexCount = 36; // BoxGeometry は既定で36 indices
    const leftTempleIndexCount = 36;

    expectOutwardWinding(buildGlassesFrameGeometry(BASE), (_centroid, i) => {
      if (i < bridgeIndexCount) return bridgeCenter;
      if (i < bridgeIndexCount + leftTempleIndexCount) return leftTempleCenter;
      return rightTempleCenter;
    });
  });
});
