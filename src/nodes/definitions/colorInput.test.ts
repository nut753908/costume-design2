import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../registry';
import './colorInput';

describe('colorInput', () => {
  it('data.hex を THREE.Color に変換して color ソケットへ出力する', () => {
    const result = getNodeType('colorInput').evaluate({}, { hex: '#123456' });
    expect(result.color).toEqual({ type: 'color', value: new THREE.Color('#123456') });
  });
});
