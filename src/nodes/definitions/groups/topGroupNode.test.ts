import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as topGeometry from '../../../geometry/top';
import * as sleeveGeometry from '../../../geometry/sleeve';
// topGroup の埋め込みサブグラフが参照する numberInput/enumInput/
// garmentPlacement/topGenerator/sleeveGenerator を含め、全ノードタイプを登録する。
import '../../definitions';

// topGroup は Top 本体と袖を1つのガーメントとして持つ。Torso Radius(`topRadiusIn`)は
// Body Build でスケールされ、その値が Top の胴体半径と袖の付け根半径の両方に渡る。
describe('topGroup', () => {
  it('torsoRadius(0.29)が bodyBuild でスケールされて Top の胴体半径と袖の付け根半径の両方へ渡る', () => {
    const topSpy = vi.spyOn(topGeometry, 'buildTopGeometry');
    const sleeveSpy = vi.spyOn(sleeveGeometry, 'buildSleeveGeometry');
    try {
      getNodeType('topGroup').evaluate({ bodyBuild: { type: 'number', value: 1.2 } }, {});
      expect(topSpy).toHaveBeenCalledWith(expect.objectContaining({ torsoRadius: 0.29 * 1.2 }));
      expect(sleeveSpy).toHaveBeenCalledWith(expect.objectContaining({ attachRadius: 0.29 * 1.2 }));
    } finally {
      topSpy.mockRestore();
      sleeveSpy.mockRestore();
    }
  });

  it('未接続なら bodyBuild は groupInput ソケット自身のデフォルト(1)で、半径はスケールされない', () => {
    const spy = vi.spyOn(topGeometry, 'buildTopGeometry');
    try {
      getNodeType('topGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ torsoRadius: 0.29 }));
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
});

function buildTopOnlyVertexCount(): number {
  return topGeometry
    .buildTopGeometry({ torsoRadius: 0.29, length: 0.5, necklineType: 'round', necklineDepth: 0.12, angleSegments: 24, heightSegments: 10 })
    .getAttribute('position').count;
}
