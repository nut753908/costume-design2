import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import { buildBeltGeometry } from '../../geometry/belt';
// scarfGroup の埋め込みサブグラフが参照する beltGenerator/boxGenerator/numberSubtract/
// numberMultiply/translateY/translateZ/mergeGeometry/toonMaterial/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../definitions';

// scarf は専用の build*Geometry() を持たず、既存の beltGenerator(帯)+boxGenerator(タイ)
// +translateY/translateZ+mergeGeometry という既存ノードの組み合わせだけで完全にノードグラフ
// 上に表現されている(scarfGroupNode.ts のコメント参照)。全パラメータがグループ内部の
// numberInput に閉じており groupInput 経由では外部から注入できないため、既定値での評価結果を
// 検証する。
describe('scarfGroup', () => {
  const DEFAULTS = {
    neckRadius: 0.19,
    bandThickness: 0.05,
    tailWidth: 0.09,
    tailLength: 0.35,
    segments: 20,
    bulge: 1.05,
    offsetY: 0.08,
  };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('scarfGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('帯(beltGenerator を bulge=1.05 で再利用)+タイ(boxGenerator)、両方ぶんの頂点を持つ', () => {
    // geometry/belt.ts の buildBeltGeometry() を独立に呼んで期待値を計算する(bandGen が
    // 内部で同じ値を beltGenerator へ配線していることの検証になる)。BoxGeometry は既定で
    // 24頂点。片方の merge 引数を取り違えていれば頂点数がずれるため、この検証だけで両方が
    // 正しく結合されていると分かる。
    const expectedBand = buildBeltGeometry({
      radius: DEFAULTS.neckRadius,
      thickness: DEFAULTS.bandThickness,
      bulge: DEFAULTS.bulge,
      segments: DEFAULTS.segments,
    });
    const result = getNodeType('scarfGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    expect(geom!.getAttribute('position').count).toBe(expectedBand.getAttribute('position').count + 24);
  });

  it('タイは tailCenterY(= (0 - bandThickness) - tailLength × 0.5)の高さまで垂れ下がる', () => {
    // 帯自身のY方向の広がり(厚み ±bandThickness/2 程度)より、タイの下端の方がずっと低いため、
    // 全体の bounding box の下端はタイ側で決まる。negatedBandThickness/halfTailLength/
    // tailCenterY の四則演算チェーンと translateY への配線、さらに garmentPlacement の
    // offsetY(既定0.08)ぶんの平行移動が正しいことの検証になる。
    const result = getNodeType('scarfGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const tailCenterY = -DEFAULTS.bandThickness - DEFAULTS.tailLength / 2;
    const expectedMinY = tailCenterY - DEFAULTS.tailLength / 2 + DEFAULTS.offsetY;
    expect(geom!.boundingBox!.min.y).toBeCloseTo(expectedMinY, 2);
  });
});
