import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// skirtGroup の埋め込みサブグラフが参照する numberInput/numberMax/numberAdd/numberMultiply/
// easedLatheCurve/latheGenerator/toonMaterial/garmentPlacement/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// skirt は geometry/skirt.ts のような専用の build*Geometry() を持たず、waistRadius(= BODY_DIMENSIONS.torsoRadius × 倍率の固定値)→
// hemRadius(= waistRadius × (1 + flare))という裾半径の導出も含めてすべて可視のノードグラフへ
// 展開されている(skirtGroupNode.ts のコメント参照)。`Down` 出力の easedLatheCurve の
// 半径は始点(waistRadius)→終点(hemRadius)まで単調に変化するため、LatheGeometry の
// bounding box の X/Z 半径は必ず max(waistRadius, hemRadius) に一致する(latheProfile.ts 参照)。
describe('skirtGroup', () => {
  const DEFAULTS = { waistRatio: 1.15, length: 0.55, flare: 0.6, offsetY: 0.19 };
  const hemRadius = BODY_DIMENSIONS.torsoRadius * DEFAULTS.waistRatio * (1 + DEFAULTS.flare);

  it('未接続でも描画対象として出力される', () => {
    const result = getNodeType('skirtGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('裾半径(waistRadius × (1 + flare))がジオメトリの最大半径になる', () => {
    const result = getNodeType('skirtGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(hemRadius, 5);
  });

  it('Length ぶん下(-Y)に伸び、Offset Y(既定0.19)だけ全体が押し上げられる', () => {
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
