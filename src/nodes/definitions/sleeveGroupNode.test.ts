import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../registry';
import * as sleeveGeometry from '../../geometry/sleeve';
// sleeveGroup の埋め込みサブグラフが参照する numberInput/enumInput/garmentPlacement/
// sleeveGenerator を含め、全ノードタイプを登録する。
import '../definitions';

// sleeveGroup は Attach Radius(Body Build 適用後の Top の胴体半径と同じ値)と Material
// (Top と同じマテリアル)を、topGroup と同じ共有ノード(initialGraph.ts の
// topRadiusScale/topMaterial)から外部ソケットとして受け取る。
describe('sleeveGroup', () => {
  it('外部から注入された attachRadius がそのまま生成ノードへ渡る', () => {
    const spy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      getNodeType('sleeveGroup').evaluate({ attachRadius: { type: 'number', value: 0.36 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ attachRadius: 0.36 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('sleeveRadius/sleeveLength は内部ノードのデフォルト値のまま外部から独立している', () => {
    const spy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      getNodeType('sleeveGroup').evaluate({ attachRadius: { type: 'number', value: 0.36 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ sleeveRadius: 0.085, sleeveLength: 0.22 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('外部から注入された material がそのまま output.material として転送される(Top と共有)', () => {
    const result = getNodeType('sleeveGroup').evaluate(
      { material: { type: 'material', value: new THREE.MeshToonMaterial({ color: new THREE.Color('#112233') }) } },
      {},
    );
    expect(result.material?.type).toBe('material');
    const material = result.material?.type === 'material' ? (result.material.value as THREE.MeshToonMaterial) : undefined;
    expect(material?.color.getHexString()).toBe('112233');
  });

  it('未接続なら attachRadius は groupInput ソケット自身のデフォルト(0.29)、material は出力に含まれない', () => {
    const spy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      const result = getNodeType('sleeveGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ attachRadius: 0.29 }));
      // material 型にはリテラルなデフォルトが無いため未接続扱いになり、そのまま material
      // キー自体が無い状態で groupOutput まで伝播する(フォールバックを持つ中継ノードは無い)。
      expect(result.material).toBeUndefined();
      expect(result.geometry?.type).toBe('geometry');
    } finally {
      spy.mockRestore();
    }
  });

  it('外部出力は geometry/material のみで、anchor/offsetY は含まれない(garmentPlacement が内部で消費し座標へ焼き込む)', () => {
    const result = getNodeType('sleeveGroup').evaluate({}, {});
    expect(result.geometry?.type).toBe('geometry');
    expect(result.anchor).toBeUndefined();
    expect(result.offsetY).toBeUndefined();
  });
});
