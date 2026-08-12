import { describe, expect, it } from 'vitest';
import { asNumber, asEnum } from './socketHelpers';

describe('asNumber', () => {
  it('接続された number ソケットの値を優先する', () => {
    expect(asNumber({ type: 'number', value: 0.5 }, 1)).toBe(0.5);
  });

  it('未接続(undefined)ならフォールバック値を返す', () => {
    expect(asNumber(undefined, 1)).toBe(1);
  });

  it('接続されていても number 型でなければフォールバック値を返す', () => {
    expect(asNumber({ type: 'enum', value: 'round' }, 1)).toBe(1);
  });
});

describe('asEnum', () => {
  it('接続された enum ソケットの値を優先する', () => {
    expect(asEnum<'round' | 'v' | 'square'>({ type: 'enum', value: 'v' }, 'round')).toBe('v');
  });

  it('未接続(undefined)ならフォールバック値を返す', () => {
    expect(asEnum<'round' | 'v' | 'square'>(undefined, 'round')).toBe('round');
  });

  it('接続されていても enum 型でなければフォールバック値を返す', () => {
    expect(asEnum<'round' | 'v' | 'square'>({ type: 'number', value: 1 }, 'round')).toBe('round');
  });
});
