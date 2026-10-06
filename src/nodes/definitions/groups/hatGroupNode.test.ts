import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// hatGroup の埋め込みサブグラフが参照する numberInput/easedLatheCurve/latheGenerator/
// toonMaterial/translate/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';

// つばの半径は固定値(0.37075)(hatGroupNode.ts のコメント参照)。
// `Up` 出力の easedLatheCurve は始点(つば=brimRadius、y=0)→終点(クラウン=
// crownRadius、y=height)まで半径が単調に変化するため、bounding box の X/Z 半径は必ず
// max(brimRadius, crownRadius) に一致する(既定値では brim の方が大きい)。
describe('hatGroup', () => {
  const DEFAULTS = { brimRadius: 0.37075, crownRadius: 0.02, height: 0.35, placementY: 1.67 };

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

  it('つば(y=0)から Height ぶん上(+Y)に伸び、全体が取り付け位置(y=1.67)へ置かれる', () => {
    const result = getNodeType('hatGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(DEFAULTS.placementY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.height + DEFAULTS.placementY, 5);
  });
});
