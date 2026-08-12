import { describe, expect, it } from 'vitest';
import { buildTopGeometry } from './top';
import type { NecklineType } from './neckline';
import { expectOutwardWinding } from './windingTestHelpers';

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

  it('全面が外向きの巻き順になっている(真っ黒なシルエット化を防ぐ)', () => {
    // necklineDepth を深くすると、ネックラインの落ち込み部分は局所的に急な傾斜(オーバー
    // ハング状)になり、正しく巻かれていても Y軸からの単純な放射方向とは法線が一致しなく
    // なる。indices.push(a, b, c) / (c, b, d) の巻き順ルール自体は necklineDepth に関わらず
    // 同一なので、彫り込みのない(=単純な円柱の壁になる)状態で巻き順ルールを検証する。
    expectOutwardWinding(build('round', 0));
  });

  it('裾(最下段の行)は necklineDepth の影響を受けない', () => {
    const shallow = build('v', 0.02);
    const deep = build('v', 0.3);
    const shallowPos = shallow.getAttribute('position').array as Float32Array;
    const deepPos = deep.getAttribute('position').array as Float32Array;

    // 最下段の行は末尾の (angleSegments + 1) 個の頂点。
    const rowStride = (BASE.angleSegments + 1) * 3;
    const lastRowStart = shallowPos.length - rowStride;
    for (let i = lastRowStart; i < shallowPos.length; i++) {
      expect(deepPos[i]).toBeCloseTo(shallowPos[i], 6);
    }
  });
});
