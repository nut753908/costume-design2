import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './legShaftAdjust';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

describe('legShaftAdjust', () => {
  it('length = length − trim + raise、lift = (trim + raise) / 2', () => {
    const r = getNodeType('legShaftAdjust').evaluate({ length: num(0.8), trim: num(0.02), raise: num(0.05) }, {});
    expect(r.length).toEqual(num(0.8 - 0.02 + 0.05));
    expect((r.lift as { value: number }).value).toBeCloseTo(0.035, 10);
  });

  it('trim/raise が未接続なら既定値 0.02 / 0.05', () => {
    const r = getNodeType('legShaftAdjust').evaluate({ length: num(1) }, {});
    expect((r.length as { value: number }).value).toBeCloseTo(1.03, 10);
    expect((r.lift as { value: number }).value).toBeCloseTo(0.035, 10);
  });
});
