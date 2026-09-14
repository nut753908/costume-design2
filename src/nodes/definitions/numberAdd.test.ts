import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './numberAdd';

describe('numberAdd', () => {
  it('a と b を data から足し合わせる', () => {
    const result = getNodeType('numberAdd').evaluate({}, { a: 3, b: 4 });
    expect(result.value).toEqual({ type: 'number', value: 7 });
  });

  it('接続された a/b ソケットを data より優先する', () => {
    const result = getNodeType('numberAdd').evaluate(
      { a: { type: 'number', value: 5 }, b: { type: 'number', value: 2 } },
      { a: 3, b: 4 },
    );
    expect(result.value).toEqual({ type: 'number', value: 7 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberAdd').createDefaultData()).toEqual({ a: 0, b: 0 });
  });
});
