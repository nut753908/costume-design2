import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../registry';
import * as topGeometry from '../../geometry/top';
// topGroup の埋め込みサブグラフが参照する numberInput/enumInput/garmentMesh/garmentAnchor/
// topGenerator を含め、全ノードタイプを登録する。
import '../definitions';

// topGroup は Torso Radius(Body Build 適用後のスケール済みの値)と Material を、共有ノード
// (initialGraph.ts の topRadiusScale/topMaterial)から外部ソケットとして受け取るだけの
// シンプルな形になった(sleeveGroup も同じ2つの値を同じ共有ノードから受け取る)。
describe('topGroup', () => {
  it('外部から注入された torsoRadius が(スケールされずそのまま)生成ノードへ渡る', () => {
    const spy = vi.spyOn(topGeometry, 'buildTopGeometry');
    try {
      getNodeType('topGroup').evaluate({ torsoRadius: { type: 'number', value: 0.36 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ torsoRadius: 0.36 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('外部から注入された material がそのまま output.material として転送される(Sleeve と共有)', () => {
    const result = getNodeType('topGroup').evaluate(
      { material: { type: 'material', value: new THREE.MeshToonMaterial({ color: new THREE.Color('#112233') }) } },
      {},
    );
    expect(result.material?.type).toBe('material');
    const material = result.material?.type === 'material' ? (result.material.value as THREE.MeshToonMaterial) : undefined;
    expect(material?.color.getHexString()).toBe('112233');
  });

  it('未接続なら torsoRadius は groupInput ソケット自身のデフォルト(0.29)、material は出力に含まれない', () => {
    const spy = vi.spyOn(topGeometry, 'buildTopGeometry');
    try {
      const result = getNodeType('topGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ torsoRadius: 0.29 }));
      // material 型にはリテラルなデフォルトが無い(literalGroupInputValue は常に undefined を
      // 返す)ため未接続扱いになる。garmentMesh はフォールバックを持たない(garmentMesh.ts
      // 参照)ため、material キー自体が無い。
      expect(result.material).toBeUndefined();
      expect(result.geometry?.type).toBe('geometry');
    } finally {
      spy.mockRestore();
    }
  });

  it('外部出力は geometry/material のみで、anchor/offsetY は含まれない(garmentPlacement が内部で消費し座標へ焼き込む)', () => {
    const result = getNodeType('topGroup').evaluate({}, {});
    expect(result.geometry?.type).toBe('geometry');
    expect(result.anchor).toBeUndefined();
    expect(result.offsetY).toBeUndefined();
  });
});
