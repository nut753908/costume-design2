import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// pantsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/mirrorPair/toonMaterial/translate/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

/** 内部の numberInput(`id`)の入力欄の値だけを差し替えた data で評価する。 */
function evaluateWithInput(type: string, id: string, value: number) {
  const def = getNodeType(type);
  const data = def.createDefaultData() as { nodes: { id: string; data: Record<string, unknown> }[] };
  const nodes = data.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, value } } : node));
  return def.evaluate({}, { ...data, nodes });
}

// pants は脚1本ぶんのジオメトリ(`Down` 出力の easedLatheCurve、始点=Waist Radius(BODY_DIMENSIONS.torsoRadius × 倍率、脚の半径 × 1.1 を下回らない)、
// 終点=Hem Radius(BODY_DIMENSIONS.legRadius × 倍率)。いずれも固定値)を mirrorPair で ±Leg Spacing だけ
// X方向に離した左右対称ペアへまとめる(pantsGroupNode.ts のコメント参照)。Leg Spacing は BODY_DIMENSIONS.legSpacing の固定値。
describe('pantsGroup', () => {
  const DEFAULTS = { waistRatio: 0.62, waistMinRatio: 1.1, hemRatio: 0.91, inseam: 1.04, y: 0.6754 };
  const { torsoRadius, legRadius } = BODY_DIMENSIONS;
  const waistRadius = Math.max(DEFAULTS.waistRatio * torsoRadius, DEFAULTS.waistMinRatio * legRadius);
  const maxRadius = Math.max(waistRadius, DEFAULTS.hemRatio * legRadius);

  it('未接続でも描画対象として出力される', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('Waist Radius(既定で Hem Radius より大きい)が左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(BODY_DIMENSIONS.legSpacing + maxRadius, 5);
  });

  it('legRadius × 倍率の Hem Radius が、裾(最下端)の半径になる', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    const position = geom!.getAttribute('position');
    let minY = Infinity;
    for (let i = 0; i < position.count; i++) minY = Math.min(minY, position.getY(i));
    // 最下端の頂点のうち右脚(x > 0)の、脚の中心(x = +legSpacing)からの最大の距離が裾の半径。
    let hem = 0;
    for (let i = 0; i < position.count; i++) {
      if (position.getX(i) > 0 && Math.abs(position.getY(i) - minY) < 1e-6) hem = Math.max(hem, Math.abs(position.getX(i) - BODY_DIMENSIONS.legSpacing));
    }
    expect(hem).toBeCloseTo(DEFAULTS.hemRatio * legRadius, 4);
  });

  it('legSpacing の値を変えると左右の間隔がそのまま最大Xへ反映される', () => {
    const result = evaluateWithInput('pantsGroup', 'legSpacing', 0.3);
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(0.3 + maxRadius, 5);
  });

  it('Inseam ぶん下(-Y)に伸び、取り付け位置 y(既定0.6754)だけ全体が押し上げられる', () => {
    const result = getNodeType('pantsGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.inseam + DEFAULTS.y, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.y, 5);
  });

});
