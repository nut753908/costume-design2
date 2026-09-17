import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './numberMultiply';

describe('numberMultiply', () => {
  it('value と factor を data から掛け合わせる', () => {
    const result = getNodeType('numberMultiply').evaluate({}, { value: 3, factor: 4 });
    expect(result.value).toEqual({ type: 'number', value: 12 });
  });

  it('接続された value/factor ソケットを data より優先する', () => {
    const result = getNodeType('numberMultiply').evaluate(
      { value: { type: 'number', value: 5 }, factor: { type: 'number', value: 2 } },
      { value: 3, factor: 4 },
    );
    expect(result.value).toEqual({ type: 'number', value: 10 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberMultiply').createDefaultData()).toEqual({ value: 1, factor: 2 });
  });
});
