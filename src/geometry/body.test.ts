import { describe, expect, it } from 'vitest';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from './body';

describe('ボディのスケールパラメータ', () => {
  it('heightScale に応じて縦方向の寸法をスケールし、半径は変えない', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 });
    const taller = computeBodyDimensions({ heightScale: 1.2, buildScale: 1, shoulderScale: 1 });
    expect(taller.legHeight).toBeCloseTo(base.legHeight * 1.2);
    expect(taller.torsoLength).toBeCloseTo(base.torsoLength * 1.2);
    expect(taller.armLength).toBeCloseTo(base.armLength * 1.2);
    expect(taller.torsoRadius).toBeCloseTo(base.torsoRadius);
    expect(taller.legRadius).toBeCloseTo(base.legRadius);
  });

  it('buildScale に応じて半径・間隔をスケールし、縦方向の長さは変えない', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 });
    const broader = computeBodyDimensions({ heightScale: 1, buildScale: 1.3, shoulderScale: 1 });
    expect(broader.torsoRadius).toBeCloseTo(base.torsoRadius * 1.3);
    expect(broader.shoulderSpacing).toBeCloseTo(base.shoulderSpacing * 1.3);
    expect(broader.legHeight).toBeCloseTo(base.legHeight);
  });

  it('shoulderScale に応じて肩幅だけをスケールし、他の寸法は変えない', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 });
    const broadShoulders = computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1.3 });
    expect(broadShoulders.shoulderSpacing).toBeCloseTo(base.shoulderSpacing * 1.3);
    expect(broadShoulders.torsoRadius).toBeCloseTo(base.torsoRadius);
    expect(broadShoulders.legSpacing).toBeCloseTo(base.legSpacing);
    expect(broadShoulders.armRadius).toBeCloseTo(base.armRadius);
  });

  it('shoulderScale は buildScale による肩幅の拡大縮小と乗算で合成される', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 });
    const both = computeBodyDimensions({ heightScale: 1, buildScale: 1.2, shoulderScale: 1.1 });
    expect(both.shoulderSpacing).toBeCloseTo(base.shoulderSpacing * 1.2 * 1.1);
  });

  it('身長が高くなるほど waist/shoulder のアンカーが上がる', () => {
    const shortLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 0.85, buildScale: 1, shoulderScale: 1 }));
    const tallLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 1.2, buildScale: 1, shoulderScale: 1 }));
    const shortAnchors = computeBodyAnchors(shortLayout);
    const tallAnchors = computeBodyAnchors(tallLayout);
    expect(tallAnchors.waist.y).toBeGreaterThan(shortAnchors.waist.y);
    expect(tallAnchors.shoulder.y).toBeGreaterThan(shortAnchors.shoulder.y);
  });

  it('feet アンカーは常に地面(y=0)にある', () => {
    const layout = computeBodyLayout(computeBodyDimensions({ heightScale: 1.2, buildScale: 1.1, shoulderScale: 1 }));
    expect(computeBodyAnchors(layout).feet.y).toBe(0);
  });

  it('身長が高くなるほど wrist アンカーが上がる(腕も一緒に伸びるため)', () => {
    const shortLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 0.85, buildScale: 1, shoulderScale: 1 }));
    const tallLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 1.2, buildScale: 1, shoulderScale: 1 }));
    expect(computeBodyAnchors(tallLayout).wrist.y).toBeGreaterThan(computeBodyAnchors(shortLayout).wrist.y);
  });

  it('身長が高くなるほど head アンカーが上がる', () => {
    const shortLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 0.85, buildScale: 1, shoulderScale: 1 }));
    const tallLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 1.2, buildScale: 1, shoulderScale: 1 }));
    expect(computeBodyAnchors(tallLayout).head.y).toBeGreaterThan(computeBodyAnchors(shortLayout).head.y);
  });
});
