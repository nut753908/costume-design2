import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './bodyDimensions';

describe('bodyDimensions', () => {
  it('未接続なら heightScale/buildScale/shoulderScale=1 相当の寸法を返す', () => {
    const result = getNodeType('bodyDimensions').evaluate({}, {});
    expect(result.torsoRadius).toEqual({ type: 'number', value: 0.26 });
    expect(result.headRadius).toEqual({ type: 'number', value: 0.16 });
  });

  it('buildScale に応じて半径・間隔をスケールし、縦方向の長さは変えない', () => {
    const base = getNodeType('bodyDimensions').evaluate(
      { heightScale: { type: 'number', value: 1 }, buildScale: { type: 'number', value: 1 }, shoulderScale: { type: 'number', value: 1 } },
      {},
    );
    const broader = getNodeType('bodyDimensions').evaluate(
      { heightScale: { type: 'number', value: 1 }, buildScale: { type: 'number', value: 1.3 }, shoulderScale: { type: 'number', value: 1 } },
      {},
    );
    expect((broader.torsoRadius as { value: number }).value).toBeCloseTo((base.torsoRadius as { value: number }).value * 1.3);
    expect((broader.legHeight as { value: number }).value).toBeCloseTo((base.legHeight as { value: number }).value);
  });

  it('headRadius は buildScale の影響を受けない', () => {
    const result = getNodeType('bodyDimensions').evaluate(
      { heightScale: { type: 'number', value: 1 }, buildScale: { type: 'number', value: 1.5 }, shoulderScale: { type: 'number', value: 1 } },
      {},
    );
    expect(result.headRadius).toEqual({ type: 'number', value: 0.16 });
  });
});
