import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildSkirtGeometry } from './skirt';

function positions(geometry: THREE.BufferGeometry): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildSkirtGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildSkirtGeometry({ waistRadius: 0.3, length: 0.5, flare: 0.5, segments: 16 });
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

  it('flare が大きくなるほど裾の半径が広がる', () => {
    const narrow = buildSkirtGeometry({ waistRadius: 0.3, length: 0.5, flare: 0.1, segments: 16 });
    const wide = buildSkirtGeometry({ waistRadius: 0.3, length: 0.5, flare: 1.5, segments: 16 });

    narrow.computeBoundingBox();
    wide.computeBoundingBox();

    const narrowRadius = narrow.boundingBox!.max.x;
    const wideRadius = wide.boundingBox!.max.x;

    expect(wideRadius).toBeGreaterThan(narrowRadius);
  });

  it('length が長くなるほど下方向に伸びる', () => {
    const short = buildSkirtGeometry({ waistRadius: 0.3, length: 0.3, flare: 0.5, segments: 16 });
    const long = buildSkirtGeometry({ waistRadius: 0.3, length: 1.0, flare: 0.5, segments: 16 });

    short.computeBoundingBox();
    long.computeBoundingBox();

    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildSkirtGeometry({ waistRadius: 0.3, length: 0.5, flare: 0.5, segments: 8 });
    const fine = buildSkirtGeometry({ waistRadius: 0.3, length: 0.5, flare: 0.5, segments: 32 });

    expect(positions(fine).length).toBeGreaterThan(positions(coarse).length);
  });
});
