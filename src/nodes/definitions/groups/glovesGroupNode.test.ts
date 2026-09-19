import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// glovesGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheProfile/
// latheGenerator/mirrorPair/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// gloves は手袋1つぶんのジオメトリ(direction='down' の easedLatheProfile、始点=Wrist Radius
// (bodyBuild でスケール)、終点=Hand Radius(スケール対象外))を mirrorPair で ±Arm Spacing だけ
// X方向に離した左右対称ペアへまとめる(glovesGroupNode.ts のコメント参照)。mirrorPair は
// 元のジオメトリ(半径 r で X=0中心)を ±offset へ平行移動するだけなので、結合後の
// bounding box の最大Xは offset + max(startRadius, endRadius) に一致する。
describe('glovesGroup', () => {
  const DEFAULTS = { wristRadius: 0.08, handRadius: 0.09, length: 0.14, armSpacing: 0.34, offsetY: 0 };
  const maxRadius = (bodyBuild: number) => Math.max(DEFAULTS.wristRadius * bodyBuild, DEFAULTS.handRadius);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('bodyBuild=1 では Hand Radius(スケール対象外)側が Wrist Radius(スケール後)より大きく、そちらが左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.armSpacing + maxRadius(1), 5);
  });

  it('bodyBuild を大きくすると Wrist Radius だけがスケールし、Hand Radius を上回って最大Xを押し広げる', () => {
    const result = getNodeType('glovesGroup').evaluate({ bodyBuild: num(3) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(DEFAULTS.wristRadius * 3).toBeGreaterThan(DEFAULTS.handRadius);
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.armSpacing + maxRadius(3), 5);
  });

  it('外部から注入された armSpacing が左右の間隔になる(bodyDimensions.shoulderSpacing の配線)', () => {
    const result = getNodeType('glovesGroup').evaluate({ armSpacing: num(0.5) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(0.5 + maxRadius(1), 5);
  });

  it('Length ぶん下(-Y)に伸びる(Wrist側が anchor=0)', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(0, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('glovesGroup').evaluate({}, {});
    const withAnchor = getNodeType('glovesGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
