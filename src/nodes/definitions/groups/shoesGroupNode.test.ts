import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// shoesGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/scale/mirrorPair/toonMaterial/translate/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../../definitions';

// shoes は靴1本ぶんのジオメトリ(`Up` 出力の easedLatheCurve、始点=Sole Radius
// (y=0)、終点=Cuff Radius(y=Height)、どちらも固定値)に `scaleZ` で
// つま先方向(Z)だけ Toe Length 倍のスケールを掛けてから、mirrorPair で ±Leg Spacing だけ
// X方向に離した左右対称ペアへまとめる(shoesGroupNode.ts のコメント参照)。scaleZ は
// `.scale(1, 1, z)` で Z軸だけを拡大するため(X軸は不変)、mirror 後の最大Xは
// scaleZ の影響を受けない。
describe('shoesGroup', () => {
  const DEFAULTS = { soleRadius: 0.08983, cuffRadius: 0.062881, legSpacing: 0.1109, height: 0.12, toeLength: 1.95, y: 0 };
  const maxRadius = Math.max(DEFAULTS.soleRadius, DEFAULTS.cuffRadius);

  it('未接続でも描画対象として出力される', () => {
    const result = getNodeType('shoesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('Sole Radius(既定で Cuff Radius より大きい)が左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('shoesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(DEFAULTS.legSpacing + maxRadius, 5);
  });

  it('固定値の Cuff Radius が、履き口(最上端)の半径になる', () => {
    const result = getNodeType('shoesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    const position = geom!.getAttribute('position');
    let maxY = -Infinity;
    for (let i = 0; i < position.count; i++) maxY = Math.max(maxY, position.getY(i));
    // 最上端の頂点のうち右脚(x > 0)の、脚の中心(x = +legSpacing)からの X 方向の最大の距離が履き口の半径
    // (scaleZ は Z 方向だけを伸ばすので、X 方向の広がりには影響しない)。
    let cuff = 0;
    for (let i = 0; i < position.count; i++) {
      if (position.getX(i) > 0 && Math.abs(position.getY(i) - maxY) < 1e-6) cuff = Math.max(cuff, Math.abs(position.getX(i) - DEFAULTS.legSpacing));
    }
    expect(cuff).toBeCloseTo(DEFAULTS.cuffRadius, 4);
  });

  it('Toe Length ぶんつま先方向(Z)だけ最大半径が伸びる(scaleZ は X には影響しない)', () => {
    const result = getNodeType('shoesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.z).toBeCloseTo(maxRadius * DEFAULTS.toeLength, 5);
  });

  it('地面(Sole側、y=0)から Height ぶん上(+Y)に伸びる', () => {
    const result = getNodeType('shoesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.height, 5);
  });

});
