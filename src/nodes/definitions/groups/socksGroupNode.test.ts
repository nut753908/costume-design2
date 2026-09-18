import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// socksGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheProfile/
// latheGenerator/mirrorPair/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// socks は靴下1本ぶんのジオメトリ(direction='up' の easedLatheProfile、始点=Ankle Radius
// (bodyBuild でスケール、y=0)、終点=Calf Radius(スケール対象外、y=Height))を mirrorPair で
// ±Leg Spacing だけ X方向に離した左右対称ペアへまとめる(socksGroupNode.ts のコメント参照)。
// 既定値では Calf Radius の方が Ankle Radius(スケール前)より大きいため、bodyBuild を十分に
// 大きくして Ankle 側が Calf を上回った状態でスケールの効果を検証する。
describe('socksGroup', () => {
  const DEFAULTS = { ankleRadius: 0.09, calfRadius: 0.105, height: 0.22, legSpacing: 0.14, offsetY: 0 };
  const maxRadius = (bodyBuild: number) => Math.max(DEFAULTS.ankleRadius * bodyBuild, DEFAULTS.calfRadius);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('bodyBuild=1 では Calf Radius(スケール対象外)側が Ankle Radius(スケール後)より大きく、そちらが左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius(1), 5);
  });

  it('bodyBuild を大きくすると Ankle Radius だけがスケールし、Calf Radius を上回って最大Xを押し広げる', () => {
    const result = getNodeType('socksGroup').evaluate({ bodyBuild: num(3) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(DEFAULTS.ankleRadius * 3).toBeGreaterThan(DEFAULTS.calfRadius);
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius(3), 5);
  });

  it('地面(Ankle側、y=0)から Height ぶん上(+Y、ふくらはぎ側)に伸びる', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.height, 5);
  });

  it('anchorY が配線されると Offset Y に加算されてさらに平行移動される', () => {
    const withoutAnchor = getNodeType('socksGroup').evaluate({}, {});
    const withAnchor = getNodeType('socksGroup').evaluate({ anchorY: num(1) }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
