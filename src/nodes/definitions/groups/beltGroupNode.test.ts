import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// beltGroup の埋め込みサブグラフが参照する bulgedBand/numberMultiply/toonMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// 帯の形状そのものの検証は bulgedBand.test.ts が持つため、ここでは beltGroup の配線
// (パラメータが bulgedBand へ正しく渡っていること)だけを確認する。
describe('beltGroup', () => {
  const geometryOf = (data: Record<string, unknown> = {}) => {
    const result = getNodeType('beltGroup').evaluate({}, data);
    return result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
  };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('beltGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('既定値(segments=24)のとき、頂点数はプロファイル13点 × 25 になる', () => {
    expect(geometryOf()!.getAttribute('position').count).toBe(13 * 25);
  });

  it('既定値(radius=1.23 × torsoRadius, thickness=0.05, bulge=1.15)の範囲に収まる(offsetY=0 のためズレが無い)', () => {
    const geom = geometryOf()!;
    geom.computeBoundingBox();
    expect(geom.boundingBox!.min.y).toBeCloseTo(-0.05, 5);
    expect(geom.boundingBox!.max.y).toBeCloseTo(0, 5);
    expect(geom.boundingBox!.max.x).toBeCloseTo(1.23 * 0.26 * 1.15, 5);
  });
});
