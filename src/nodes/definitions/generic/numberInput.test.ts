import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './numberInput';

describe('numberInput', () => {
  it('data.value を number ソケットへそのまま出力する', () => {
    const result = getNodeType('numberInput').evaluate({}, { value: 0.42 });
    expect(result.value).toEqual({ type: 'number', value: 0.42 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('numberInput').createDefaultData()).toEqual({
      value: 1,
      min: 0,
      max: 10,
      step: 0.1,
    });
  });
});
