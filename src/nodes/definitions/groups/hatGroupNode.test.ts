import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// hatGroup の埋め込みサブグラフが参照する numberInput/easedLatheCurve/latheGenerator/
// toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// つばの半径はボディの基準の頭半径 × 1.25 の固定値(hatGroupNode.ts のコメント参照)。
// `Up` 出力の easedLatheCurve は始点(つば=brimRadius、y=0)→終点(クラウン=
// crownRadius、y=height)まで半径が単調に変化するため、bounding box の X/Z 半径は必ず
// max(brimRadius, crownRadius) に一致する(既定値では brim の方が大きい)。
describe('hatGroup', () => {
  const DEFAULTS = { brimRadius: BODY_DIMENSIONS.headRadius * 1.25, crownRadius: 0.02, height: 0.35, offsetY: 0.1 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('hatGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('つば(Brim Radius)がジオメトリの最大半径になる', () => {
    const result = getNodeType('hatGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.brimRadius, 5);
  });

  it('つば(y=0)から Height ぶん上(+Y)に伸び、Offset Y(既定0.1)だけ全体が押し上げられる', () => {
    const result = getNodeType('hatGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(DEFAULTS.offsetY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.height + DEFAULTS.offsetY, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('hatGroup').evaluate({}, {});
    const withAnchor = getNodeType('hatGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
