import { describe, expect, it } from 'vitest';
import { buildScarfGeometry } from './scarf';

function positions(geometry: ReturnType<typeof buildScarfGeometry>): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

const BASE = { neckRadius: 0.19, bandThickness: 0.05, tailWidth: 0.09, tailLength: 0.35, segments: 20 };

describe('buildScarfGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildScarfGeometry(BASE);
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

  it('首の輪の上端(y=0)からタイの先端(y=-bandThickness-tailLength)まで積み上がる', () => {
    const geometry = buildScarfGeometry(BASE);
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.min.y).toBeCloseTo(-(BASE.bandThickness + BASE.tailLength), 5);
  });

  it('tailLength が長くなるほどタイが下に伸びる', () => {
    const short = buildScarfGeometry({ ...BASE, tailLength: 0.2 });
    const long = buildScarfGeometry({ ...BASE, tailLength: 0.6 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
  });

  it('neckRadius が大きくなるほど首の輪が外側に広がる', () => {
    const narrow = buildScarfGeometry({ ...BASE, neckRadius: 0.15 });
    const wide = buildScarfGeometry({ ...BASE, neckRadius: 0.3 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildScarfGeometry({ ...BASE, segments: 8 });
    const fine = buildScarfGeometry({ ...BASE, segments: 32 });
    expect(positions(fine).length).toBeGreaterThan(positions(coarse).length);
  });
});
