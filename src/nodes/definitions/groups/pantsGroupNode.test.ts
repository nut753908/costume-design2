import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// pantsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheProfile/
// latheGenerator/mirrorPair/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// pants は脚1本ぶんのジオメトリ(direction='down' の easedLatheProfile、始点=Waist Radius
// (bodyBuild でスケール)、終点=Hem Radius(スケール対象外))を mirrorPair で ±Leg Spacing だけ
// X方向に離した左右対称ペアへまとめる(pantsGroupNode.ts のコメント参照)。Leg Spacing は
// bodyDimensions(initialGraph.ts の共有ノード)の legSpacing を受け取る外部ソケットのまま。
describe('pantsGroup', () => {
  const DEFAULTS = { waistRadius: 0.16, hemRadius: 0.1, inseam: 0.75, legSpacing: 0.14, offsetY: 0 };
  const maxRadius = (bodyBuild: number) => Math.max(DEFAULTS.waistRadius * bodyBuild, DEFAULTS.hemRadius);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('Waist Radius(既定で Hem Radius より大きい)が左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius(1), 5);
  });

  it('bodyBuild が大きくなるほど Waist Radius がスケールし最大Xを押し広げる(Hem Radius はスケール対象外)', () => {
    const result = getNodeType('pantsGroup').evaluate({ bodyBuild: num(2) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius(2), 5);
  });

  it('legSpacing を注入すると左右の間隔がそのまま最大Xへ反映される(bodyDimensions.legSpacing の配線)', () => {
    const result = getNodeType('pantsGroup').evaluate({ legSpacing: num(0.3) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(0.3 + maxRadius(1), 5);
  });

  it('Inseam ぶん下(-Y)に伸びる(Waist側が anchor=0)', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.inseam, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(0, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('pantsGroup').evaluate({}, {});
    const withAnchor = getNodeType('pantsGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
