import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// glovesGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/mirrorPair/toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// gloves は手袋1つぶんのジオメトリ(`Down` 出力の easedLatheCurve、始点=Wrist Radius、
// 終点=Hand Radius、どちらもボディの基準の腕の半径 × 倍率の固定値)を mirrorPair で ±Arm Spacing だけ
// X方向に離した左右対称ペアへまとめる(glovesGroupNode.ts のコメント参照)。mirrorPair は
// 元のジオメトリ(半径 r で X=0中心)を ±offset へ平行移動するだけなので、結合後の
// bounding box の最大Xは offset + max(startRadius, endRadius) に一致する。
describe('glovesGroup', () => {
  const ARM_RADIUS = BODY_DIMENSIONS.armRadius;
  const DEFAULTS = { wristRadius: 1.4 * ARM_RADIUS, handRadius: 1.55 * ARM_RADIUS, length: 0.16, armSpacing: 0.15, offsetY: 0.04 };
  const maxRadius = Math.max(DEFAULTS.wristRadius, DEFAULTS.handRadius);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('既定では Hand Radius が Wrist Radius より大きく、そちらが左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.armSpacing + maxRadius, 5);
  });

  it('外部から注入された armSpacing が左右の間隔になる', () => {
    const result = getNodeType('glovesGroup').evaluate({ armSpacing: num(0.5) }, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(0.5 + maxRadius, 5);
  });

  it('Length ぶん下(-Y)に伸び、Offset Y(既定0.04、手の上端を覆う)だけ押し上げられる', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length + DEFAULTS.offsetY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.offsetY, 5);
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
