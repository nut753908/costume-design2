import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { asNumber } from './socketHelpers';

describe('asNumber', () => {
  it('接続された number ソケットの値を優先する', () => {
    expect(asNumber({ type: 'number', value: 0.5 }, 1)).toBe(0.5);
  });

  it('未接続(undefined)ならフォールバック値を返す', () => {
    expect(asNumber(undefined, 1)).toBe(1);
  });

  it('接続されていても number 型でなければフォールバック値を返す', () => {
    expect(asNumber({ type: 'color', value: new THREE.Color('#ffffff') }, 1)).toBe(1);
  });
});
