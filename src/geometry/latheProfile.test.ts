import { describe, expect, it } from 'vitest';
import { EasedLatheCurve } from './latheProfile';

const points = (direction: 'up' | 'down', steps = 10) => new EasedLatheCurve(0.2, 0.1, 0.5, direction).getPoints(steps);

describe('EasedLatheCurve', () => {
  it('getPoints(steps) は steps+1 個の点を生成する', () => {
    expect(points('down')).toHaveLength(11);
  });

  it("direction='down' はアンカーが末尾(y=0)、反対側が先頭(y=-distance)になる", () => {
    const p = points('down');
    expect(p[0].y).toBeCloseTo(-0.5, 5);
    expect(p[0].x).toBeCloseTo(0.1, 5);
    expect(p[p.length - 1].y).toBeCloseTo(0, 5);
    expect(p[p.length - 1].x).toBeCloseTo(0.2, 5);
  });

  it("direction='up' はアンカーが先頭(y=0)、反対側が末尾(y=distance)になる", () => {
    const p = points('up');
    expect(p[0].y).toBeCloseTo(0, 5);
    expect(p[0].x).toBeCloseTo(0.2, 5);
    expect(p[p.length - 1].y).toBeCloseTo(0.5, 5);
    expect(p[p.length - 1].x).toBeCloseTo(0.1, 5);
  });

  it('どちらの direction でも点列は下(小さいy)→上(大きいy)の順になる', () => {
    for (const direction of ['down', 'up'] as const) {
      const p = points(direction);
      for (let i = 1; i < p.length; i++) {
        expect(p[i].y).toBeGreaterThanOrEqual(p[i - 1].y);
      }
    }
  });
});
