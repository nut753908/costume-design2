import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// scarfGroup の埋め込みサブグラフが参照する bulgedBand/boxGenerator/numberSubtract/
// numberMultiply/translate/mergeGeometry/toonMaterial/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../../definitions';

// scarf は専用の build*Geometry() を持たず、既存の bulgedBand(帯)+boxGenerator(タイ)
// +translate+mergeGeometry という既存ノードの組み合わせだけで完全にノードグラフ
// 上に表現されている(scarfGroupNode.ts のコメント参照)。全パラメータがグループ内部の
// numberInput に閉じており groupInput 経由では外部から注入できないため、既定値での評価結果を
// 検証する。
describe('scarfGroup', () => {
  const DEFAULTS = {
    neckRadius: 2.2 * 0.045,
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

  it('帯(bulgedBand を bulge=1.05 で再利用)+タイ(boxGenerator)、両方ぶんの頂点を持つ', () => {
    // 帯はプロファイル13点 × (segments+1) の頂点(bulgedBand.test.ts 参照)。BoxGeometry は既定で
    // 24頂点。片方の merge 引数を取り違えていれば頂点数がずれるため、この検証だけで両方が
    // 正しく結合されていると分かる。
    const expectedBand = 13 * (DEFAULTS.segments + 1);
    const result = getNodeType('scarfGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    expect(geom!.getAttribute('position').count).toBe(expectedBand + 24);
  });

  it('タイは tailCenterY(= (0 - bandThickness) - tailLength × 0.5)の高さまで垂れ下がる', () => {
    // 帯自身のY方向の広がり(厚み ±bandThickness/2 程度)より、タイの下端の方がずっと低いため、
    // 全体の bounding box の下端はタイ側で決まる。negatedBandThickness/halfTailLength/
    // tailCenterY の四則演算チェーンと translate の Y への配線、さらに garmentPlacement の
    // offsetY(既定0.08)ぶんの平行移動が正しいことの検証になる。
    const result = getNodeType('scarfGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const tailCenterY = -DEFAULTS.bandThickness - DEFAULTS.tailLength / 2;
    const expectedMinY = tailCenterY - DEFAULTS.tailLength / 2 + DEFAULTS.offsetY;
    expect(geom!.boundingBox!.min.y).toBeCloseTo(expectedMinY, 2);
  });
});
