import { describe, expect, it } from 'vitest';
import { buildDressGeometry } from './dress';
import type { NecklineType } from './neckline';
import { expectOutwardWinding } from './windingTestHelpers';

const BASE = {
  torsoRadius: 0.3,
  hemRadius: 0.55,
  length: 0.9,
  angleSegments: 16,
  heightSegments: 10,
} as const;

function build(necklineType: NecklineType, necklineDepth: number) {
  return buildDressGeometry({ ...BASE, necklineType, necklineDepth });
}

describe('buildDressGeometry', () => {
  it('NaN 頂点のない、妥当で退化していないジオメトリを生成する', () => {
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

  it('リンググリッドの寸法に対して期待通りの頂点数になる', () => {
    const geometry = build('round', 0.15);
    const vertexCount = geometry.getAttribute('position').count;
    expect(vertexCount).toBe((BASE.angleSegments + 1) * (BASE.heightSegments + 1));
  });

  it('肩(最上段)は torsoRadius、裾(最下段)は hemRadius に近い半径になる', () => {
    const geometry = build('round', 0);
    geometry.computeBoundingBox();
    // torsoRadius(0.3) < hemRadius(0.55) なので、裾に向かって広がっているはず。
    expect(geometry.boundingBox!.max.x).toBeGreaterThan(BASE.torsoRadius);
    expect(geometry.boundingBox!.max.x).toBeLessThanOrEqual(BASE.hemRadius + 1e-6);
  });

  it('hemRadius が大きくなるほど裾側が広がる', () => {
    const narrow = buildDressGeometry({ ...BASE, hemRadius: 0.35, necklineType: 'round', necklineDepth: 0 });
    const wide = buildDressGeometry({ ...BASE, hemRadius: 0.9, necklineType: 'round', necklineDepth: 0 });
    narrow.computeBoundingBox();
    wide.computeBoundingBox();
    expect(wide.boundingBox!.max.x).toBeGreaterThan(narrow.boundingBox!.max.x);
  });

  it('length が長くなるほど下方向に伸びる', () => {
    const short = buildDressGeometry({ ...BASE, length: 0.4, necklineType: 'round', necklineDepth: 0 });
    const long = buildDressGeometry({ ...BASE, length: 1.2, necklineType: 'round', necklineDepth: 0 });
    short.computeBoundingBox();
    long.computeBoundingBox();
    expect(long.boundingBox!.min.y).toBeLessThan(short.boundingBox!.min.y);
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

  it('どのネックラインタイプでも necklineDepth が深くなるほど最上段リングの前面が下がる', () => {
    for (const type of ['round', 'v', 'square'] as const) {
      const shallow = build(type, 0.02);
      const deep = build(type, 0.3);
      expect(topRowMinY(deep)).toBeLessThan(topRowMinY(shallow));
    }
  });

  it('裾(最下段の行)は necklineDepth の影響を受けない', () => {
    const shallow = build('v', 0.02);
    const deep = build('v', 0.3);
    const shallowPos = shallow.getAttribute('position').array as Float32Array;
    const deepPos = deep.getAttribute('position').array as Float32Array;

    const rowStride = (BASE.angleSegments + 1) * 3;
    const lastRowStart = shallowPos.length - rowStride;
    for (let i = lastRowStart; i < shallowPos.length; i++) {
      expect(deepPos[i]).toBeCloseTo(shallowPos[i], 6);
    }
  });

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    // top.test.ts と同じ理由で、ネックラインの彫り込みが無い(単純な壁になる)状態で検証する。
    expectOutwardWinding(build('round', 0));
  });
});
