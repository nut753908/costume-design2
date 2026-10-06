import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './armShaftAdjust';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const val = (r: Record<string, unknown>, k: string) => (r[k] as { value: number }).value;

describe('armShaftAdjust', () => {
  it('length は drop 短く、centerY は drop/2 下がり、spacing は inset 狭くなる', () => {
    const r = getNodeType('armShaftAdjust').evaluate(
      { length: num(0.6), centerY: num(1.4), spacing: num(0.3), drop: num(0.04), inset: num(0.01) },
      {},
    );
    expect(val(r, 'length')).toBeCloseTo(0.56, 10);
    expect(val(r, 'centerY')).toBeCloseTo(1.38, 10);
    expect(val(r, 'spacing')).toBeCloseTo(0.29, 10);
  });

  it('drop/inset が未接続なら既定値 0.0293 / 0.01843', () => {
    const r = getNodeType('armShaftAdjust').evaluate({ length: num(1), centerY: num(1), spacing: num(1) }, {});
    expect(val(r, 'length')).toBeCloseTo(1 - 0.0293, 10);
    expect(val(r, 'spacing')).toBeCloseTo(1 - 0.01843, 10);
  });
});
