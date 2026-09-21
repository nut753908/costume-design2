import { describe, expect, it } from 'vitest';
import { ConcatCurve } from './concatCurve';
import { EasedLatheCurve } from './latheProfile';

describe('ConcatCurve', () => {
  const a = new EasedLatheCurve(0.3, 0.2, 0.1, 'up');
  const b = new EasedLatheCurve(0.2, 0.1, 0.1, 'up');
  const curve = new ConcatCurve(a, b);

  it('前半は a、後半は b を通り、t=0.5 は b の始点になる', () => {
    expect(curve.getPoint(0)).toEqual(a.getPoint(0));
    expect(curve.getPoint(0.25)).toEqual(a.getPoint(0.5));
    expect(curve.getPoint(0.5)).toEqual(b.getPoint(0));
    expect(curve.getPoint(1)).toEqual(b.getPoint(1));
  });

  it('getPoints(2n) は a と b を n 分割ずつ、つなぎ目を重複させずに並べる(2n+1 個)', () => {
    const points = curve.getPoints(12);
    expect(points).toHaveLength(13);
    expect(points[5]).toEqual(a.getPoint(5 / 6));
    expect(points[6]).toEqual(b.getPoint(0));
  });
});
