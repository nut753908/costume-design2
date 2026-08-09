import { describe, expect, it } from 'vitest';
import { buildTopGeometry, type NecklineType } from './top';

const BASE = {
  torsoRadius: 0.3,
  length: 0.5,
  angleSegments: 16,
  heightSegments: 8,
} as const;

function build(necklineType: NecklineType, necklineDepth: number) {
  return buildTopGeometry({ ...BASE, necklineType, necklineDepth });
}

describe('buildTopGeometry', () => {
  it('produces a valid, non-degenerate geometry with no NaN vertices', () => {
    const geometry = build('round', 0.15);
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

  it('has the expected vertex count for the ring-grid dimensions', () => {
    const geometry = build('round', 0.15);
    const vertexCount = geometry.getAttribute('position').count;
    expect(vertexCount).toBe((BASE.angleSegments + 1) * (BASE.heightSegments + 1));
  });

  function topRowMinY(geometry: ReturnType<typeof build>): number {
    const pos = geometry.getAttribute('position').array as Float32Array;
    const rowVertexCount = BASE.angleSegments + 1;
    let min = Infinity;
    for (let i = 0; i < rowVertexCount; i++) {
      min = Math.min(min, pos[i * 3 + 1]);
    }
    return min;
  }

  it('lowers the front of the top ring as necklineDepth increases, for every neckline type', () => {
    for (const type of ['round', 'v', 'square'] as const) {
      const shallow = build(type, 0.02);
      const deep = build(type, 0.3);
      expect(topRowMinY(deep)).toBeLessThan(topRowMinY(shallow));
    }
  });

  it('leaves the hem (bottom row) unaffected by necklineDepth', () => {
    const shallow = build('v', 0.02);
    const deep = build('v', 0.3);
    const shallowPos = shallow.getAttribute('position').array as Float32Array;
    const deepPos = deep.getAttribute('position').array as Float32Array;

    // Bottom row is the last (angleSegments + 1) vertices.
    const rowStride = (BASE.angleSegments + 1) * 3;
    const lastRowStart = shallowPos.length - rowStride;
    for (let i = lastRowStart; i < shallowPos.length; i++) {
      expect(deepPos[i]).toBeCloseTo(shallowPos[i], 6);
    }
  });
});
