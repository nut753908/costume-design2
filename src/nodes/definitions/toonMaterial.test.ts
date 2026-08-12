import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import * as toonMaterialFactory from '../../rendering/ToonMaterialFactory';
import { getNodeType } from '../registry';
import './toonMaterial';

describe('toonMaterial', () => {
  it('color ソケットが接続されていれば、その色で createToonMaterial を呼ぶ(data は無視)', () => {
    const spy = vi.spyOn(toonMaterialFactory, 'createToonMaterial');
    const connectedColor = new THREE.Color('#123456');
    getNodeType('toonMaterial').evaluate(
      { color: { type: 'color', value: connectedColor } },
      { color: '#cccccc' },
    );
    expect(spy).toHaveBeenCalledWith(connectedColor);
    spy.mockRestore();
  });

  it('color ソケットが未接続なら data.color から THREE.Color を作って createToonMaterial を呼ぶ', () => {
    const spy = vi.spyOn(toonMaterialFactory, 'createToonMaterial');
    getNodeType('toonMaterial').evaluate({}, { color: '#abcdef' });
    expect(spy).toHaveBeenCalledWith(new THREE.Color('#abcdef'));
    spy.mockRestore();
  });
});
