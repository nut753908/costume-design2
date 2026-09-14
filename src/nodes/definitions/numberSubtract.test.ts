import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './numberSubtract';

describe('numberSubtract', () => {
  it('a から b を data で引く', () => {
    const result = getNodeType('numberSubtract').evaluate({}, { a: 7, b: 4 });
    expect(result.value).toEqual({ type: 'number', value: 3 });
  });

  it('接続された a/b ソケットを data より優先する', () => {
    const result = getNodeType('numberSubtract').evaluate(
      { a: { type: 'number', value: 10 }, b: { type: 'number', value: 3 } },
      { a: 7, b: 4 },
    );
    expect(result.value).toEqual({ type: 'number', value: 7 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberSubtract').createDefaultData()).toEqual({ a: 0, b: 0 });
  });
});
