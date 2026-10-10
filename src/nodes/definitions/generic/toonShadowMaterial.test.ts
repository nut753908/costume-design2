import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './toonShadowMaterial';

describe('toonShadowMaterial', () => {
  it('色と影の色から、影の色つきのトゥーンマテリアルを作る', () => {
    const out = getNodeType('toonShadowMaterial').evaluate(
      { color: { type: 'color', value: new THREE.Color('#fae6da') }, shadowColor: { type: 'color', value: new THREE.Color('#f0c9ae') } },
      {},
    ).material;
    expect(out?.type).toBe('material');
    const material = out?.type === 'material' ? (out.value as THREE.MeshToonMaterial) : undefined;
    expect(material!.color.getHexString()).toBe('fae6da');
    expect(typeof material!.onBeforeCompile).toBe('function');
  });

  it('未接続なら入力欄の既定色で作る', () => {
    const out = getNodeType('toonShadowMaterial').evaluate({}, {}).material;
    const material = out?.type === 'material' ? (out.value as THREE.MeshToonMaterial) : undefined;
    expect(material!.color.getHexString()).toBe('cccccc');
  });

  it('doubleSided が 1 なら裏面も描き、既定(0)なら表面だけ', () => {
    const sideOf = (data: Record<string, unknown>) => {
      const out = getNodeType('toonShadowMaterial').evaluate({}, data).material;
      return out?.type === 'material' ? (out.value as THREE.MeshToonMaterial).side : undefined;
    };
    expect(sideOf({})).toBe(THREE.FrontSide);
    expect(sideOf({ doubleSided: 1 })).toBe(THREE.DoubleSide);
  });
});
