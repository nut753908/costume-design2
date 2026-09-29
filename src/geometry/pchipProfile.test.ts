import { describe, expect, it } from 'vitest';
import { PchipProfileCurve } from './pchipProfile';

describe('PchipProfileCurve', () => {
  it('高さは t × length で、制御点(等間隔の高さ)の半径をそのまま通る', () => {
    const curve = new PchipProfileCurve([0, 0.5, 1, 0.5, 0], 2);
    for (let i = 0; i < 5; i++) {
      const point = curve.getPoint(i / 4);
      expect(point.y).toBeCloseTo((i / 4) * 2, 10);
      expect(point.x).toBeCloseTo([0, 0.5, 1, 0.5, 0][i], 10);
    }
  });

  it('半径がすべて同じなら、途中も同じ半径(円柱)になる', () => {
    const curve = new PchipProfileCurve([0.3, 0.3, 0.3, 0.3], 1);
    for (let t = 0; t <= 1; t += 0.05) expect(curve.getPoint(t).x).toBeCloseTo(0.3, 10);
  });

  it('制御点の間でオーバーシュートしない(最大の制御半径を超えない)', () => {
    const curve = new PchipProfileCurve([0, 0.2, 1, 1, 0.3, 0.9, 0], 1);
    for (let t = 0; t <= 1; t += 0.01) {
      const x = curve.getPoint(t).x;
      expect(x).toBeLessThanOrEqual(1 + 1e-9);
      expect(x).toBeGreaterThanOrEqual(0);
    }
  });

  it('半径 0 の端は球の極のように丸く閉じる(端の近くで半径は高さの平方根で増える)', () => {
    // 球(半径 1、高さ 2)の等間隔の制御点
    const heights = Array.from({ length: 9 }, (_, i) => (i / 8) * 2);
    const radii = heights.map((h) => Math.sqrt(Math.max(0, 1 - (h - 1) ** 2)));
    const curve = new PchipProfileCurve(radii, 2);
    for (let t = 0; t <= 1; t += 0.02) {
      const point = curve.getPoint(t);
      expect(Math.hypot(point.x, point.y - 1)).toBeCloseTo(1, 1);
    }
  });

  it('t が範囲外でも端の値に収まる', () => {
    const curve = new PchipProfileCurve([0.1, 0.5, 0.2], 1);
    expect(curve.getPoint(-1).y).toBe(0);
    expect(curve.getPoint(2).y).toBe(1);
  });
});
