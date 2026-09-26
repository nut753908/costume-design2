import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function curveOf(inputs: Record<string, number>): THREE.Curve<THREE.Vector2> {
  const result = getNodeType('shoulderedProfile').evaluate(
    Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])),
    {},
  );
  if (result.curve?.type !== 'curve') throw new Error('curve が出力されていない');
  return result.curve.value;
}

describe('shoulderedProfile', () => {
  const base = { torsoRadius: 0.2, chestRadius: 0.22, hemRadius: 0.3, neckOpening: 0.08, length: 0.6 };

  it('下端は裾(y = -length、hemRadius)、上端は首まわり(y = torsoRadius × 0.1、neckOpening)', () => {
    const curve = curveOf(base);
    const bottom = curve.getPoint(0);
    const top = curve.getPoint(1);
    expect(bottom.x).toBeCloseTo(0.3, 6);
    expect(bottom.y).toBeCloseTo(-0.6, 6);
    expect(top.x).toBeCloseTo(0.08, 6);
    expect(top.y).toBeCloseTo(0.2 * 0.1, 6);
  });

  it('曲線の中央が胸(y = -torsoRadius × 0.6、chestRadius)で、そこから上が肩の丸み', () => {
    const chest = curveOf(base).getPoint(0.5);
    expect(chest.x).toBeCloseTo(0.22, 6);
    expect(chest.y).toBeCloseTo(-0.2 * 0.6, 6);
  });

  it('下から上へ高さが単調に増える(受け取る側が下→上の点列を期待するため)', () => {
    const points = curveOf(base).getPoints(16);
    for (let i = 1; i < points.length; i++) expect(points[i].y).toBeGreaterThan(points[i - 1].y);
  });
});
