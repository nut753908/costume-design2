import { describe, expect, it } from 'vitest';
import { buildBeltGeometry } from './belt';
import { expectOutwardWinding } from './windingTestHelpers';

function positions(geometry: ReturnType<typeof buildBeltGeometry>): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

describe('buildBeltGeometry', () => {
  it('妥当で退化していないジオメトリを生成する', () => {
    const geometry = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.15, segments: 24 });
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

  it('上端(y=0、waist アンカー)から下端(y=-thickness)まで積み上がる', () => {
    const geometry = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.15, segments: 24 });
    geometry.computeBoundingBox();
    expect(geometry.boundingBox!.max.y).toBeCloseTo(0, 5);
    expect(geometry.boundingBox!.min.y).toBeCloseTo(-0.06, 5);
  });

  it('bulge が大きくなるほど中間の膨らみが外側に広がる', () => {
    const flat = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.0, segments: 24 });
    const bulged = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.4, segments: 24 });
    flat.computeBoundingBox();
    bulged.computeBoundingBox();
    expect(bulged.boundingBox!.max.x).toBeGreaterThan(flat.boundingBox!.max.x);
  });

  it('radius が大きくなるほど全体が外側に広がる', () => {
    const narrow = buildBeltGeometry({ radius: 0.2, thickness: 0.06, bulge: 1.15, segments: 24 });
    const wide = buildBeltGeometry({ radius: 0.4, thickness: 0.06, bulge: 1.15, segments: 24 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('segments が増えるほど頂点数が増える', () => {
    const coarse = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.15, segments: 8 });
    const fine = buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.15, segments: 32 });
    expect(positions(fine).length).toBeGreaterThan(positions(coarse).length);
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    expectOutwardWinding(buildBeltGeometry({ radius: 0.32, thickness: 0.06, bulge: 1.15, segments: 24 }));
  });
});
