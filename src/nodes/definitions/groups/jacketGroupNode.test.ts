import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// jacketGroup の埋め込みサブグラフが参照する numberInput/numberMax/numberAdd/numberMultiply/
// easedLatheCurve/latheGenerator/toonMaterial/garmentPlacement/sceneOutput を含め、
// 全ノードタイプを登録する。
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// jacket は skirtGroupNode.ts と全く同じ理由・同じ形(geometry/jacket.ts のような専用の
// build*Geometry() を持たず、裾半径(hemRadius = shoulderRadius × (1 + hemFlare))の導出も
// 含めてすべて可視のノードグラフへ展開されている)。`Down` 出力の easedLatheCurve の
// 半径は始点(shoulderRadius)→終点(hemRadius)まで単調に変化するため、LatheGeometry の
// bounding box の X/Z 半径は必ず max(shoulderRadius, hemRadius) に一致する。
describe('jacketGroup', () => {
  const DEFAULTS = { shoulderRadius: 1.15 * BODY_DIMENSIONS.torsoRadius, length: 0.46, hemFlare: 0.15, offsetY: 0 };
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

  it('Length ぶん下(-Y)に伸び、肩の丸みの上端(首まわり)は肩の頂点より BODY_DIMENSIONS.torsoRadius × 0.1 上にある', () => {
    const result = getNodeType('jacketGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(BODY_DIMENSIONS.torsoRadius * 0.1, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('jacketGroup').evaluate({}, {});
    const withAnchor = getNodeType('jacketGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
