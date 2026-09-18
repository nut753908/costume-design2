import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './numberNegate';

describe('numberNegate', () => {
  it('value の符号を反転する(data)', () => {
    const result = getNodeType('numberNegate').evaluate({}, { value: 0.26 });
    expect(result.value).toEqual({ type: 'number', value: -0.26 });
  });

  it('接続された value ソケットを data より優先する', () => {
    const result = getNodeType('numberNegate').evaluate({ value: { type: 'number', value: 5 } }, { value: 7 });
    expect(result.value).toEqual({ type: 'number', value: -5 });
  });

  it('負の値は正に反転する', () => {
    const result = getNodeType('numberNegate').evaluate({}, { value: -0.5 });
    expect(result.value).toEqual({ type: 'number', value: 0.5 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberNegate').createDefaultData()).toEqual({ value: 0 });
  });
});
