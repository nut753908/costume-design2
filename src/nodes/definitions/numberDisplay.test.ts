import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './numberDisplay';

describe('numberDisplay', () => {
  it('接続された value ソケットの値をそのまま出力する', () => {
    const result = getNodeType('numberDisplay').evaluate({ value: { type: 'number', value: 0.77 } }, {});
    expect(result.value).toEqual({ type: 'number', value: 0.77 });
  });

  it('value ソケットが未接続なら 0 にフォールバックする', () => {
    const result = getNodeType('numberDisplay').evaluate({}, {});
    expect(result.value).toEqual({ type: 'number', value: 0 });
  });
});
