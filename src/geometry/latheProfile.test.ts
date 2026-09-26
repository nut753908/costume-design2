import { describe, expect, it } from 'vitest';
import { EasedLatheCurve, EllipticLatheCurve } from './latheProfile';

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

describe('EllipticLatheCurve', () => {
  it("direction='down' はアンカー(y=0、startRadius)が末尾、反対側(y=-distance、endRadius)が先頭", () => {
    const curve = new EllipticLatheCurve(0.1, 0.3, 0.2, 'down');
    expect(curve.getPoint(1).x).toBeCloseTo(0.1, 10);
    expect(curve.getPoint(1).y).toBeCloseTo(0, 10);
    expect(curve.getPoint(0).x).toBeCloseTo(0.3, 10);
    expect(curve.getPoint(0).y).toBeCloseTo(-0.2, 10);
  });

  it('アンカー側では接線が水平(高さが変わらず半径だけ変わる)、反対端では垂直(半径が変わらない)', () => {
    const curve = new EllipticLatheCurve(0.1, 0.3, 0.2, 'up');
    const h = 1e-4;
    const nearAnchor = curve.getPoint(h).clone().sub(curve.getPoint(0));
    expect(Math.abs(nearAnchor.y)).toBeLessThan(Math.abs(nearAnchor.x) * 1e-2);
    const nearEnd = curve.getPoint(1).clone().sub(curve.getPoint(1 - h));
    expect(Math.abs(nearEnd.x)).toBeLessThan(Math.abs(nearEnd.y) * 1e-2);
  });
});
