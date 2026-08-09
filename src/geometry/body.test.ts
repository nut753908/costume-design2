import { describe, expect, it } from 'vitest';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from './body';

describe('body scale params', () => {
  it('scales vertical dimensions with heightScale, leaving radii untouched', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1 });
    const taller = computeBodyDimensions({ heightScale: 1.2, buildScale: 1 });
    expect(taller.legHeight).toBeCloseTo(base.legHeight * 1.2);
    expect(taller.torsoLength).toBeCloseTo(base.torsoLength * 1.2);
    expect(taller.armLength).toBeCloseTo(base.armLength * 1.2);
    expect(taller.torsoRadius).toBeCloseTo(base.torsoRadius);
    expect(taller.legRadius).toBeCloseTo(base.legRadius);
  });

  it('scales radii/spacing with buildScale, leaving vertical lengths untouched', () => {
    const base = computeBodyDimensions({ heightScale: 1, buildScale: 1 });
    const broader = computeBodyDimensions({ heightScale: 1, buildScale: 1.3 });
    expect(broader.torsoRadius).toBeCloseTo(base.torsoRadius * 1.3);
    expect(broader.shoulderSpacing).toBeCloseTo(base.shoulderSpacing * 1.3);
    expect(broader.legHeight).toBeCloseTo(base.legHeight);
  });

  it('raises the waist/shoulder anchors as height increases', () => {
    const shortLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 0.85, buildScale: 1 }));
    const tallLayout = computeBodyLayout(computeBodyDimensions({ heightScale: 1.2, buildScale: 1 }));
    const shortAnchors = computeBodyAnchors(shortLayout);
    const tallAnchors = computeBodyAnchors(tallLayout);
    expect(tallAnchors.waist.y).toBeGreaterThan(shortAnchors.waist.y);
    expect(tallAnchors.shoulder.y).toBeGreaterThan(shortAnchors.shoulder.y);
  });
});
