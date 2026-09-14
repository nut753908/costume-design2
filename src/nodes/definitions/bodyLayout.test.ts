import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './bodyLayout';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

describe('bodyLayout', () => {
  it('legHeight が伸びるほど、その上に積み上がる torsoCenterY/headCenterY も上がる', () => {
    const short = getNodeType('bodyLayout').evaluate(
      { legHeight: num(0.7), torsoLength: num(0.55), torsoRadius: num(0.26), headRadius: num(0.16), armLength: num(0.62) },
      {},
    );
    const tall = getNodeType('bodyLayout').evaluate(
      { legHeight: num(1.0), torsoLength: num(0.55), torsoRadius: num(0.26), headRadius: num(0.16), armLength: num(0.62) },
      {},
    );
    expect((tall.torsoCenterY as { value: number }).value).toBeGreaterThan((short.torsoCenterY as { value: number }).value);
    expect((tall.headCenterY as { value: number }).value).toBeGreaterThan((short.headCenterY as { value: number }).value);
  });

  it('legCenterY は常に legHeight/2', () => {
    const result = getNodeType('bodyLayout').evaluate(
      { legHeight: num(0.8), torsoLength: num(0.55), torsoRadius: num(0.26), headRadius: num(0.16), armLength: num(0.62) },
      {},
    );
    expect((result.legCenterY as { value: number }).value).toBeCloseTo(0.4);
  });
});
