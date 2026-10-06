import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// jacketGroup の埋め込みサブグラフが参照する numberInput/numberMax/numberAdd/numberMultiply/
// easedLatheCurve/latheGenerator/toonMaterial/translate/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../../definitions';

// jacket は skirtGroupNode.ts と全く同じ理由・同じ形(geometry/jacket.ts のような専用の
// build*Geometry() を持たず、裾半径(hemRadius = shoulderRadius × (1 + hemFlare))の導出も
// 含めてすべて可視のノードグラフへ展開されている)。`Down` 出力の easedLatheCurve の
// 半径は始点(shoulderRadius)→終点(hemRadius)まで単調に変化するため、LatheGeometry の
// bounding box の X/Z 半径は必ず max(shoulderRadius, hemRadius) に一致する。
describe('jacketGroup', () => {
  const DEFAULTS = { shoulderRadius: 0.17664, neckTopRise: 0.01536, length: 0.46, hemFlare: 0.15, placementY: 1.2169 };
  const hemRadius = (shoulderScaled: number) => shoulderScaled * (1 + DEFAULTS.hemFlare);

  it('描画対象として出力される', () => {
    const result = getNodeType('jacketGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('裾半径(shoulderRadius × (1 + hemFlare))がジオメトリの最大半径になる', () => {
    const result = getNodeType('jacketGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(hemRadius(DEFAULTS.shoulderRadius), 5);
  });

  it('Length ぶん下(-Y)に伸び、肩の丸みの上端(首まわり)は肩の頂点(取り付け位置 y=1.2169)より 0.01536 上にある', () => {
    const result = getNodeType('jacketGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length + DEFAULTS.placementY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.neckTopRise + DEFAULTS.placementY, 5);
  });
});
