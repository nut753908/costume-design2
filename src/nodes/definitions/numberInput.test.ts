import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './numberInput';

describe('numberInput', () => {
  it('data.value を number ソケットへそのまま出力する', () => {
    const result = getNodeType('numberInput').evaluate({}, { value: 0.42 });
    expect(result.value).toEqual({ type: 'number', value: 0.42 });
  });
});
