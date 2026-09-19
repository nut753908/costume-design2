import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as ringGridGeometry from '../../../geometry/ringGrid';
import * as sleeveGeometry from '../../../geometry/sleeve';
// topGroup の埋め込みサブグラフが参照する numberInput/enumInput/
// garmentPlacement/easedLatheProfile/ringGridGenerator/sleeveGenerator を含め、全ノードタイプを登録する。
import '../../definitions';

// topGroup は Top 本体と袖を1つのガーメントとして持つ。Torso Radius(`topRadiusIn`)は
// Body Build でスケールされ、その値が Top の胴体半径と袖の付け根半径の両方に渡る。
describe('topGroup', () => {
  it('torsoRadius(0.29)が bodyBuild でスケールされて Top の胴体半径と袖の付け根半径の両方へ渡る', () => {
    const topSpy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    const sleeveSpy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      getNodeType('topGroup').evaluate({ bodyBuild: { type: 'number', value: 1.2 } }, {});
      expect(firstRowRadius(topSpy)).toBeCloseTo(0.29 * 1.2, 10);
      expect(sleeveSpy).toHaveBeenCalledWith(expect.objectContaining({ attachRadius: 0.29 * 1.2 }));
    } finally {
      topSpy.mockRestore();
      sleeveSpy.mockRestore();
    }
  });

  it('未接続なら bodyBuild は groupInput ソケット自身のデフォルト(1)で、半径はスケールされない', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('topGroup').evaluate({}, {});
      expect(firstRowRadius(spy)).toBeCloseTo(0.29, 10);
    } finally {
      spy.mockRestore();
    }
  });

  it('sleeveRadius/sleeveLength は内部ノードのデフォルト値のまま bodyBuild から独立している', () => {
    const spy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      getNodeType('topGroup').evaluate({ bodyBuild: { type: 'number', value: 1.2 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ sleeveRadius: 0.085, sleeveLength: 0.22 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('Top と袖は1つのジオメトリへ結合され、sceneOutputGeometry0/sceneOutputMaterial0 の1組だけが出力される(anchor/offsetY は含まれない — garmentPlacement が内部で消費し座標へ焼き込む)', () => {
    const result = getNodeType('topGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.sceneOutputGeometry1).toBeUndefined();
    expect(result.anchor).toBeUndefined();
    expect(result.offsetY).toBeUndefined();
  });

  it('結合後の頂点数は Top 単体より多い(袖ぶんが乗っている)', () => {
    const count = (r: ReturnType<ReturnType<typeof getNodeType>['evaluate']>) =>
      r.sceneOutputGeometry0?.type === 'geometry' ? r.sceneOutputGeometry0.value.getAttribute('position').count : 0;
    const withSleeves = count(getNodeType('topGroup').evaluate({}, {}));
    expect(withSleeves).toBeGreaterThan(0);
    const topOnly = buildTopOnlyVertexCount();
    expect(withSleeves).toBeGreaterThan(topOnly);
  });

  it('内部の sleeveGen → merge の配線を切ると、Top 本体だけが描画される', () => {
    const def = getNodeType('topGroup');
    const data = def.createDefaultData() as { nodes: unknown[]; edges: { source: string; target: string }[] };
    const withoutSleeves = { ...data, edges: data.edges.filter((e) => e.source !== 'sleeveGen') };
    const result = def.evaluate({}, withoutSleeves);
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    const count = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value.getAttribute('position').count : 0;
    expect(count).toBe(buildTopOnlyVertexCount());
  });
});

/** 直近の buildRingGridGeometry() 呼び出しの最上段(肩)の半径。 */
function firstRowRadius(spy: { mock: { calls: unknown[][] } }): number {
  const rows = spy.mock.calls[0][0] as { radius: number }[];
  return rows[0].radius;
}

/** angleSegments=24、heightSegments=10 のリンググリッドの頂点数。 */
function buildTopOnlyVertexCount(): number {
  return (24 + 1) * (10 + 1);
}
