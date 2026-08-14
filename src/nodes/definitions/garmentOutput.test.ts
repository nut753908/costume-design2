import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import * as toonMaterialFactory from '../../rendering/ToonMaterialFactory';
import { getNodeType } from '../registry';
import './garmentOutput';

describe('garmentOutput', () => {
  it('anchor と offsetY を data からそのまま出力する', () => {
    const result = getNodeType('garmentOutput').evaluate(
      {},
      { anchor: 'shoulder', offsetY: 0.12, fallbackColor: '#cccccc' },
    );
    expect(result.anchor).toEqual({ type: 'enum', value: 'shoulder' });
    expect(result.offsetY).toEqual({ type: 'number', value: 0.12 });
  });

  it('material が接続されていればそれをそのまま出力し、fallbackColor は使わない', () => {
    const spy = vi.spyOn(toonMaterialFactory, 'createToonMaterial');
    const connectedMaterial = new THREE.MeshToonMaterial();
    const result = getNodeType('garmentOutput').evaluate(
      { material: { type: 'material', value: connectedMaterial } },
      { anchor: 'waist', fallbackColor: '#cccccc' },
    );
    expect(result.material).toEqual({ type: 'material', value: connectedMaterial });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('material が未接続なら fallbackColor から createToonMaterial を呼ぶ', () => {
    const spy = vi.spyOn(toonMaterialFactory, 'createToonMaterial');
    getNodeType('garmentOutput').evaluate({}, { anchor: 'waist', fallbackColor: '#cccccc' });
    expect(spy).toHaveBeenCalledWith('#cccccc');
    spy.mockRestore();
  });

  it('geometry が接続されていれば出力に含め、未接続なら含めない', () => {
    const withGeometry = getNodeType('garmentOutput').evaluate(
      { geometry: { type: 'geometry', value: new THREE.BufferGeometry() } },
      { anchor: 'waist' },
    );
    expect(withGeometry.geometry).toBeDefined();

    const withoutGeometry = getNodeType('garmentOutput').evaluate({}, { anchor: 'waist' });
    expect(withoutGeometry.geometry).toBeUndefined();
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('garmentOutput').createDefaultData()).toEqual({
      anchor: 'waist',
      offsetY: 0,
      fallbackColor: '#cccccc',
    });
  });
});
