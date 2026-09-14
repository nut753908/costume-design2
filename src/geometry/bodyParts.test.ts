import { describe, expect, it } from 'vitest';
import { buildHeadGeometry, buildLimbPairGeometry, buildTorsoGeometry } from './bodyParts';

function positions(geometry: ReturnType<typeof buildTorsoGeometry>): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildTorsoGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildTorsoGeometry({ radius: 0.26, length: 0.55 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });

  it('radius が大きくなるほど全体が外側に広がる', () => {
    const narrow = buildTorsoGeometry({ radius: 0.2, length: 0.55 });
    const wide = buildTorsoGeometry({ radius: 0.4, length: 0.55 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('length が長くなるほど縦方向に伸びる', () => {
    const short = buildTorsoGeometry({ radius: 0.26, length: 0.3 });
    const long = buildTorsoGeometry({ radius: 0.26, length: 0.9 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.max.y - long.boundingBox!.min.y).toBeGreaterThan(
      short.boundingBox!.max.y - short.boundingBox!.min.y,
    );
  });
});

describe('buildHeadGeometry', () => {
  it('radius が大きくなるほど全体が広がる', () => {
    const small = buildHeadGeometry({ radius: 0.1 });
    const large = buildHeadGeometry({ radius: 0.3 });
    small.computeBoundingBox();
    large.computeBoundingBox();
    expect(large.boundingBox!.max.x).toBeGreaterThan(small.boundingBox!.max.x);
  });
});

describe('buildLimbPairGeometry', () => {
  it('spacing だけ離れた左右2本を1つのジオメトリにまとめる', () => {
    const geometry = buildLimbPairGeometry({ radius: 0.08, length: 0.6, spacing: 0.2 });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.x).toBeCloseTo(0.2 + 0.08, 5);
    expect(geometry.boundingBox!.min.x).toBeCloseTo(-(0.2 + 0.08), 5);
  });

  it('spacing が広がるほど左右の間隔が広がる', () => {
    const narrow = buildLimbPairGeometry({ radius: 0.08, length: 0.6, spacing: 0.15 });
    const wide = buildLimbPairGeometry({ radius: 0.08, length: 0.6, spacing: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildLimbPairGeometry({ radius: 0.08, length: 0.6, spacing: 0.2 });
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    const pos = positions(geometry);
    for (let i = 0; i < pos.length; i++) expect(Number.isNaN(pos[i])).toBe(false);
  });
});
