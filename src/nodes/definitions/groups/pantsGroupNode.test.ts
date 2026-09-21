import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// pantsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/mirrorPair/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// pants は脚1本ぶんのジオメトリ(`Down` 出力の easedLatheCurve、始点=Waist Radius
// (bodyBuild でスケール)、終点=Hem Radius、どちらも bodyBuild でスケール)を mirrorPair で ±Leg Spacing だけ
// X方向に離した左右対称ペアへまとめる(pantsGroupNode.ts のコメント参照)。Leg Spacing は
// bodyDimensions(initialGraph.ts の共有ノード)の legSpacing を受け取る外部ソケットのまま。
describe('pantsGroup', () => {
  const DEFAULTS = { waistRadius: 0.16, hemRadius: 0.1, inseam: 0.75, legSpacing: 0.14, offsetY: 0 };
  const maxRadius = (bodyBuild: number) => Math.max(DEFAULTS.waistRadius, DEFAULTS.hemRadius) * bodyBuild;

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

  it('bodyBuild が大きくなるほど Waist Radius がスケールし最大Xを押し広げる', () => {
    const result = getNodeType('pantsGroup').evaluate({ bodyBuild: num(2) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius(2), 5);
  });

  it('bodyBuild を掛けた Hem Radius が、裾(最下端)の半径になる', () => {
    const result = getNodeType('pantsGroup').evaluate({ bodyBuild: num(1.3) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    const position = geom!.getAttribute('position');
    let minY = Infinity;
    for (let i = 0; i < position.count; i++) minY = Math.min(minY, position.getY(i));
    // 最下端の頂点のうち右脚(x > 0)の、脚の中心(x = +legSpacing)からの最大の距離が裾の半径。
    let hem = 0;
    for (let i = 0; i < position.count; i++) {
      if (position.getX(i) > 0 && Math.abs(position.getY(i) - minY) < 1e-6) hem = Math.max(hem, Math.abs(position.getX(i) - DEFAULTS.legSpacing));
    }
    expect(hem).toBeCloseTo(DEFAULTS.hemRadius * 1.3, 4);
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
