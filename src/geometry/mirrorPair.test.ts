import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildMirroredPairGeometry } from './mirrorPair';

function buildStubPart(): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
}

describe('buildMirroredPairGeometry', () => {
  it('build() の頂点数のちょうど2倍を持つ、NaN のないジオメトリを生成する', () => {
    const single = buildStubPart();
    const merged = buildMirroredPairGeometry(buildStubPart, 0.2);

    expect(merged.getAttribute('position').count).toBe(single.getAttribute('position').count * 2);

    const pos = merged.getAttribute('position').array as Float32Array;
    for (let i = 0; i < pos.length; i++) {
      expect(Number.isNaN(pos[i])).toBe(false);
    }
  });

  it('X方向に鏡像となる2つのパーツを ±offset の位置に配置する', () => {
    const merged = buildMirroredPairGeometry(buildStubPart, 0.3);
    merged.computeBoundingBox();
    const box = merged.boundingBox!;
    expect(box.max.x).toBeGreaterThan(0);
    expect(box.min.x).toBeLessThan(0);
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
  });

  it('offset が広がるほど2パーツの間隔も広がる', () => {
    const narrow = buildMirroredPairGeometry(buildStubPart, 0.1);
    const wide = buildMirroredPairGeometry(buildStubPart, 0.4);
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });
});
