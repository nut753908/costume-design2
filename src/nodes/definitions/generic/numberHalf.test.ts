import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './numberHalf';

describe('numberHalf', () => {
  it('value を半分にする(data)', () => {
    const result = getNodeType('numberHalf').evaluate({}, { value: 0.14 });
    expect(result.value).toEqual({ type: 'number', value: 0.07 });
  });

  it('接続された value ソケットを data より優先する', () => {
    const result = getNodeType('numberHalf').evaluate({ value: { type: 'number', value: 4 } }, { value: 7 });
    expect(result.value).toEqual({ type: 'number', value: 2 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberHalf').createDefaultData()).toEqual({ value: 0 });
  });
});
