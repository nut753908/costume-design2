import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// socksGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/mirrorPair/toonMaterial/translate/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

// socks は靴下1本ぶんのジオメトリ(`Up` 出力の easedLatheCurve、始点=Ankle Radius(y=0)、
// 終点=Calf Radius(y=Height)、どちらも BODY_DIMENSIONS.legRadius × 倍率の固定値)を mirrorPair で
// ±Leg Spacing だけ X方向に離した左右対称ペアへまとめる(socksGroupNode.ts のコメント参照)。
describe('socksGroup', () => {
  const { legRadius } = BODY_DIMENSIONS;
  const DEFAULTS = { ankleRadius: 0.92 * legRadius, calfRadius: 0.95 * legRadius, height: 0.22, y: 0.09 };
  const maxRadius = Math.max(DEFAULTS.ankleRadius, DEFAULTS.calfRadius);

  it('未接続でも描画対象として出力される', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('既定では Calf Radius が Ankle Radius より大きく、そちらが左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(BODY_DIMENSIONS.legSpacing + maxRadius, 5);
  });

  it('足の上(取り付け位置 y、既定0.09)から Height ぶん上(+Y、ふくらはぎ側)に伸びる', () => {
    const result = getNodeType('socksGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(DEFAULTS.y, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.y + DEFAULTS.height, 5);
  });

});
