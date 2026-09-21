import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// skirtGroup の埋め込みサブグラフが参照する numberInput/numberMax/numberAdd/numberMultiply/
// easedLatheCurve/latheGenerator/toonMaterial/garmentPlacement/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// skirt は geometry/skirt.ts のような専用の build*Geometry() を持たず、waistRadius(scale後)→
// hemRadius(= waistRadius × (1 + flare))という裾半径の導出も含めてすべて可視のノードグラフへ
// 展開されている(skirtGroupNode.ts のコメント参照)。`Down` 出力の easedLatheCurve の
// 半径は始点(waistRadius)→終点(hemRadius)まで単調に変化するため、LatheGeometry の
// bounding box の X/Z 半径は必ず max(waistRadius, hemRadius) に一致する(latheProfile.ts 参照)。
describe('skirtGroup', () => {
  const DEFAULTS = { waistRadius: 0.3, length: 0.55, flare: 0.7, offsetY: 0.03 };
  const hemRadius = (waistScaled: number) => waistScaled * (1 + DEFAULTS.flare);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('skirtGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('裾半径(waistRadius × (1 + flare))がジオメトリの最大半径になる', () => {
    const result = getNodeType('skirtGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(hemRadius(DEFAULTS.waistRadius), 5);
  });

  it('bodyBuild が大きくなるほどウエスト/裾どちらも比例してスケールする', () => {
    const result = getNodeType('skirtGroup').evaluate({ bodyBuild: num(2) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(hemRadius(DEFAULTS.waistRadius * 2), 5);
  });

  it('Length ぶん下(-Y)に伸び、Offset Y(既定0.03)だけ全体が押し上げられる', () => {
    const result = getNodeType('skirtGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length + DEFAULTS.offsetY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.offsetY, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('skirtGroup').evaluate({}, {});
    const withAnchor = getNodeType('skirtGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
