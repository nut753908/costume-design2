import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './enumInput';

describe('enumInput', () => {
  it('data.value を enum ソケットへそのまま出力する', () => {
    const result = getNodeType('enumInput').evaluate({}, { value: 'square', options: ['round', 'v', 'square'] });
    expect(result.value).toEqual({ type: 'enum', value: 'square' });
  });
});
