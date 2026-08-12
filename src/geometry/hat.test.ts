import { describe, expect, it } from 'vitest';
import { buildHatGeometry } from './hat';

function positions(geometry: ReturnType<typeof buildHatGeometry>): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildHatGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.35, segments: 16 });
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

  it('地面(つば、y=0)から頂点(y=height)まで積み上がる', () => {
    const geometry = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.35, segments: 16 });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.max.y).toBeCloseTo(0.35, 5);
  });

  it('brimRadius が大きくなるほどつばが広がる', () => {
    const narrow = buildHatGeometry({ brimRadius: 0.1, crownRadius: 0.02, height: 0.35, segments: 16 });
    const wide = buildHatGeometry({ brimRadius: 0.3, crownRadius: 0.02, height: 0.35, segments: 16 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('height が高くなるほど背が高くなる', () => {
    const short = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.15, segments: 16 });
    const tall = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.5, segments: 16 });
    short.computeBoundingBox();
    tall.computeBoundingBox();
    expect(tall.boundingBox!.max.y).toBeGreaterThan(short.boundingBox!.max.y);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.35, segments: 8 });
    const fine = buildHatGeometry({ brimRadius: 0.2, crownRadius: 0.02, height: 0.35, segments: 32 });
    expect(positions(fine).length).toBeGreaterThan(positions(coarse).length);
  });
});
