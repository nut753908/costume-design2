import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './numberMax';

describe('numberMax', () => {
  it('a と b の大きい方を data から求める', () => {
    const result = getNodeType('numberMax').evaluate({}, { a: 3, b: 7 });
    expect(result.value).toEqual({ type: 'number', value: 7 });
  });

  it('接続された a/b ソケットを data より優先する', () => {
    const result = getNodeType('numberMax').evaluate(
      { a: { type: 'number', value: -2 }, b: { type: 'number', value: 0 } },
      { a: 3, b: 4 },
    );
    expect(result.value).toEqual({ type: 'number', value: 0 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberMax').createDefaultData()).toEqual({ a: 0, b: 0 });
  });
});
