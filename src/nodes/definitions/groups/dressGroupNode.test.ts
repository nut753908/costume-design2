import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as ringGridGeometry from '../../../geometry/ringGrid';
// dressGroup の埋め込みサブグラフが参照する numberInput/colorInput/numberMultiply/
// easedLatheCurve/ringGridGenerator/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';

// dress は easedLatheCurve(肩→裾の半径)→ ringGridGenerator(geometry/ringGrid.ts による
// ネックライン彫り込み)で組まれる(dressGroupNode.ts のコメント参照)。Torso Radius は
// 体の torsoRadius × 1.12、Hem Radius はその (1 + flare) 倍で決まり、他のパラメータは内部の numberInput のデフォルトのまま
// 渡ることを、buildRingGridGeometry() への引数の spy で検証する(topGroupNode.test.ts と同じ手法)。
describe('dressGroup', () => {
  const DEFAULTS = { torsoRadius: 1.12 * 0.14, hemRadius: 1.12 * 0.14 * 1.3, length: 0.9, necklineDepth: 0.12 };

  /** 直近の buildRingGridGeometry() 呼び出しの引数を、DEFAULTS と同じ名前の値へ戻す。 */
  function ringGridArgs(spy: { mock: { calls: unknown[][] } }) {
    const [rows, , , necklineDepth] = spy.mock.calls[0] as [{ radius: number; y: number }[], number, THREE.Vector2[], number];
    return {
      torsoRadius: rows[0].radius,
      hemRadius: rows[rows.length - 1].radius,
      length: -rows[rows.length - 1].y,
      necklineDepth,
    };
  }
  const closeTo = (actual: ReturnType<typeof ringGridArgs>, expected: typeof DEFAULTS) => {
    expect(actual.necklineDepth).toBe(expected.necklineDepth);
    expect(actual.torsoRadius).toBeCloseTo(expected.torsoRadius, 10);
    expect(actual.hemRadius).toBeCloseTo(expected.hemRadius, 10);
    expect(actual.length).toBeCloseTo(expected.length, 10);
  };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('dressGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('未接続なら torsoRadius は groupInput ソケット自身のデフォルト(0.14)になる', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('dressGroup').evaluate({}, {});
      closeTo(ringGridArgs(spy), DEFAULTS);
    } finally {
      spy.mockRestore();
    }
  });

  it('torsoRadius に比例して Torso Radius と Hem Radius が変化し、Length 等は変わらない', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('dressGroup').evaluate({ torsoRadius: { type: 'number', value: 0.14 * 2 } }, {});
      closeTo(ringGridArgs(spy), { ...DEFAULTS, torsoRadius: DEFAULTS.torsoRadius * 2, hemRadius: DEFAULTS.hemRadius * 2 });
    } finally {
      spy.mockRestore();
    }
  });

  it('Color ソケットの既定値(#3d7a72)が sceneOutputMaterial0 に使われる', () => {
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
