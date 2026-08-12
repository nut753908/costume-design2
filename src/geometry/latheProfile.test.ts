import { describe, expect, it } from 'vitest';
import { buildEasedLatheProfile } from './latheProfile';

describe('buildEasedLatheProfile', () => {
  it('steps+1 個の点を生成する', () => {
    const points = buildEasedLatheProfile(0.2, 0.1, 0.5, 'down', 10);
    expect(points).toHaveLength(11);
  });

  it("direction='down' はアンカーが末尾(y=0)、反対側が先頭(y=-distance)になるよう反転済み", () => {
    const points = buildEasedLatheProfile(0.2, 0.1, 0.5, 'down', 10);
    expect(points[0].y).toBeCloseTo(-0.5, 5);
    expect(points[0].x).toBeCloseTo(0.1, 5);
    expect(points[points.length - 1].y).toBeCloseTo(0, 5);
    expect(points[points.length - 1].x).toBeCloseTo(0.2, 5);
  });

  it("direction='up' はアンカーが先頭(y=0)、反対側が末尾(y=distance)になる(反転なし)", () => {
    const points = buildEasedLatheProfile(0.2, 0.1, 0.5, 'up', 10);
    expect(points[0].y).toBeCloseTo(0, 5);
    expect(points[0].x).toBeCloseTo(0.2, 5);
    expect(points[points.length - 1].y).toBeCloseTo(0.5, 5);
    expect(points[points.length - 1].x).toBeCloseTo(0.1, 5);
  });

  it('どちらの direction でも配列は下(小さいy)→上(大きいy)の順になる', () => {
    for (const direction of ['down', 'up'] as const) {
      const points = buildEasedLatheProfile(0.2, 0.1, 0.5, direction, 10);
      for (let i = 1; i < points.length; i++) {
        expect(points[i].y).toBeGreaterThanOrEqual(points[i - 1].y);
      }
    }
  });
});
