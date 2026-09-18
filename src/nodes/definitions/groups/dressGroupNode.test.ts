import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as dressGeometry from '../../../geometry/dress';
// dressGroup の埋め込みサブグラフが参照する numberInput/enumInput/colorInput/numberMultiply/
// dressGenerator/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';

// dress は skirt/jacket と違い geometry/dress.ts の buildDressGeometry()(ringGrid によるネック
// ライン彫り込み)をそのまま呼ぶ dressGenerator を使う(dressGroupNode.ts のコメント参照)。
// Torso Radius だけが bodyBuild でスケールされ、他のパラメータは内部の numberInput/enumInput
// のデフォルトのまま渡ることを spy で検証する(topGroupNode.test.ts と同じ手法)。
describe('dressGroup', () => {
  const DEFAULTS = { torsoRadius: 0.29, hemRadius: 0.55, length: 0.9, necklineType: 'round', necklineDepth: 0.12 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('dressGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('未接続なら bodyBuild は1のフォールバックで、Torso Radius はスケールされず既定値のまま渡る', () => {
    const spy = vi.spyOn(dressGeometry, 'buildDressGeometry');
    try {
      getNodeType('dressGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining(DEFAULTS));
    } finally {
      spy.mockRestore();
    }
  });

  it('bodyBuild が大きくなるほど Torso Radius(スケール後)だけが変化し、Hem Radius/Length 等は変わらない', () => {
    const spy = vi.spyOn(dressGeometry, 'buildDressGeometry');
    try {
      getNodeType('dressGroup').evaluate({ bodyBuild: { type: 'number', value: 2 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ ...DEFAULTS, torsoRadius: DEFAULTS.torsoRadius * 2 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('内部の colorIn(デフォルト #3d7a72)が sceneOutputMaterial0 に使われる', () => {
    const result = getNodeType('dressGroup').evaluate({}, {});
    const material = result.sceneOutputMaterial0;
    const color = material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color : undefined;
    expect(color?.getHexString()).toBe(new THREE.Color('#3d7a72').getHexString());
  });

  it('anchorY が配線されると Offset Y(既定0)に加算されて平行移動される', () => {
    const withoutAnchor = getNodeType('dressGroup').evaluate({}, {});
    const withAnchor = getNodeType('dressGroup').evaluate({ anchorY: { type: 'number', value: 1 } }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
