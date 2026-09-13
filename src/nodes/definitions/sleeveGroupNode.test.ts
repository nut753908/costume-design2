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

  it('外部から注入された material が sceneOutputMaterial0 として転送される(Top と共有、内部の sceneOutput 経由)', () => {
    const result = getNodeType('sleeveGroup').evaluate(
      { material: { type: 'material', value: new THREE.MeshToonMaterial({ color: new THREE.Color('#112233') }) } },
      {},
    );
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    const material = result.sceneOutputMaterial0?.type === 'material' ? (result.sceneOutputMaterial0.value as THREE.MeshToonMaterial) : undefined;
    expect(material?.color.getHexString()).toBe('112233');
  });

  it('未接続なら attachRadius は groupInput ソケット自身のデフォルト(0.29)、sceneOutputMaterial0 は出力に含まれない', () => {
    const spy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      const result = getNodeType('sleeveGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ attachRadius: 0.29 }));
      // material 型にはリテラルなデフォルトが無いため未接続扱いになり、内部の sceneOutput が
      // geometry/material の両方を受け取れず、sceneOutputGeometry0/sceneOutputMaterial0 とも
      // 転送されない(groupNodeFactory.ts 参照)。
      expect(result.sceneOutputMaterial0).toBeUndefined();
      expect(result.sceneOutputGeometry0).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('material も配線されていれば、sceneOutputGeometry0/sceneOutputMaterial0 の両方が外部出力に含まれる(anchor/offsetY は含まれない — garmentPlacement が内部で消費し座標へ焼き込む)', () => {
    const result = getNodeType('sleeveGroup').evaluate(
      { material: { type: 'material', value: new THREE.MeshToonMaterial({ color: new THREE.Color('#112233') }) } },
      {},
    );
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.anchor).toBeUndefined();
    expect(result.offsetY).toBeUndefined();
  });
});
