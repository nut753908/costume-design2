import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { buildBeltGeometry } from '../../../geometry/belt';
// beltGroup の埋め込みサブグラフが参照する easedLatheProfile/translatePointsY/slicePoints/
// concatPoints/latheGenerator/numberSubtract/numberMultiply/toonMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// beltGroup 自身は beltGenerator(geometry/belt.ts の buildBeltGeometry() をそのまま呼ぶ
// ブラックボックス)を使わず、プロファイル生成+連結+Lathe化をすべて可視のノードグラフへ
// 展開している(beltGroupNode.ts のコメント参照)。geometry/belt.ts は scarfGroupNode.ts が
// beltGenerator 経由で使う — この独立した buildBeltGeometry() 呼び出しを「正解」として、
// ノードグラフ側の評価結果と一致することを検証する。
describe('beltGroup', () => {
  const DEFAULTS = { radius: 0.32, thickness: 0.05, bulge: 1.15, segments: 24 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('beltGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('頂点数が geometry/belt.ts の buildBeltGeometry() と一致する(プロファイル生成+連結+Lathe化の再現)', () => {
    const expected = buildBeltGeometry(DEFAULTS);
    const result = getNodeType('beltGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    expect(geom!.getAttribute('position').count).toBe(expected.getAttribute('position').count);
  });

  it('バウンディングボックスが geometry/belt.ts の buildBeltGeometry() と一致する(offsetY=0 のためズレが無い)', () => {
    const expected = buildBeltGeometry(DEFAULTS);
    expected.computeBoundingBox();
    const result = getNodeType('beltGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(expected.boundingBox!.min.y, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(expected.boundingBox!.max.y, 5);
    expect(geom!.boundingBox!.max.x).toBeCloseTo(expected.boundingBox!.max.x, 5);
  });
});
