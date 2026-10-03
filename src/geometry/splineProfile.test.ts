import { describe, expect, it } from 'vitest';
import { SignedSplineCurve, SplineProfileCurve } from './splineProfile';

describe('SplineProfileCurve', () => {
  it('高さは t × length で、制御点(等間隔の高さ)の半径をそのまま通る', () => {
    const curve = new SplineProfileCurve([0, 0.5, 1, 0.5, 0], 2);
    for (let i = 0; i < 5; i++) {
      const point = curve.getPoint(i / 4);
      expect(point.y).toBeCloseTo((i / 4) * 2, 10);
      expect(point.x).toBeCloseTo([0, 0.5, 1, 0.5, 0][i], 10);
    }
  });

  it('半径がすべて同じなら、途中も同じ半径(円柱)になる', () => {
    const curve = new SplineProfileCurve([0.3, 0.3, 0.3, 0.3], 1);
    for (let t = 0; t <= 1; t += 0.05) expect(curve.getPoint(t).x).toBeCloseTo(0.3, 10);
  });

  it('制御点が球の上にあれば、途中も球の輪郭をほぼ正確に再現する(端も丸く閉じる)', () => {
    const heights = Array.from({ length: 9 }, (_, i) => (i / 8) * 2);
    const radii = heights.map((h) => Math.sqrt(Math.max(0, 1 - (h - 1) ** 2)));
    const curve = new SplineProfileCurve(radii, 2);
    for (let t = 0; t <= 1; t += 0.02) {
      const point = curve.getPoint(t);
      expect(Math.hypot(point.x, point.y - 1)).toBeCloseTo(1, 3);
    }
  });

  it('曲率が制御点をまたいで連続する(制御点で輪郭に折れが出ない)', () => {
    const curve = new SplineProfileCurve([0, 0.6, 0.9, 1, 0.9, 0.7, 0.5, 0.4, 0], 1);
    // 制御点(t = k/8)の前後の傾き(dx/dt)が、ほぼ連続していること
    const slope = (t: number) => (curve.getPoint(t + 1e-6).x - curve.getPoint(t - 1e-6).x) / 2e-6;
    for (let k = 2; k <= 6; k++) {
      const t = k / 8;
      expect(Math.abs(slope(t - 1e-4) - slope(t + 1e-4))).toBeLessThan(0.05);
    }
  });

  it('半径は 0 未満にならない', () => {
    const curve = new SplineProfileCurve([0, 0.2, 1, 1, 0.3, 0.9, 0], 1);
    for (let t = 0; t <= 1; t += 0.01) expect(curve.getPoint(t).x).toBeGreaterThanOrEqual(0);
  });

  it('t が範囲外でも端の値に収まる', () => {
    const curve = new SplineProfileCurve([0.1, 0.5, 0.2], 1);
    expect(curve.getPoint(-1).y).toBe(0);
    expect(curve.getPoint(2).y).toBe(1);
  });
});

describe('SignedSplineCurve', () => {
  it('負の値も含めて制御値をそのまま通り、高さは t × length', () => {
    const values = [0, 0.4, -0.3, 0.2, 0];
    const curve = new SignedSplineCurve(values, 2);
    for (let i = 0; i < 5; i++) {
      const point = curve.getPoint(i / 4);
      expect(point.y).toBeCloseTo((i / 4) * 2, 10);
      expect(point.x).toBeCloseTo(values[i], 10);
    }
  });

  it('制御値がすべて 0 なら、途中も常に 0', () => {
    const curve = new SignedSplineCurve(new Array<number>(9).fill(0), 1);
    for (let t = 0; t <= 1; t += 0.05) expect(curve.getPoint(t).x).toBe(0);
  });
});
