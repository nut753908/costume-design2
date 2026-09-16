import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
// glassesGroup の埋め込みサブグラフが参照する glassesFrameGenerator/torusGenerator/
// numberSubtract/numberMultiply/translateX/translateZ/mergeGeometry/toonMaterial/
// sceneOutput を含め、全ノードタイプを登録する。
import '../definitions';

// 左右のレンズ(ノードグラフ側の torusGenerator+translateX/translateZ、
// negatedLensSpacing = 0 - lensSpacing を四則演算チェーンで導出)と、ブリッジ+左右テンプル
// (コード側の alignedBox、frameGen)を mergeGeometry×2で1つにまとめる、というハイブリッド
// 構成が正しく配線されているかを検証する(glassesGroupNode.ts のコメント参照)。全パラメータが
// グループ内部の numberInput に閉じており groupInput 経由では外部から注入できないため、
// 既定値での評価結果を検証する。
describe('glassesGroup', () => {
  // offsetYIn の既定値(-0.02)ぶん、garmentPlacement が最終的な geometry 全体をY方向へ
  // 平行移動する(anchorY はここでは未接続のため0にフォールバックする)。
  const DEFAULTS = { lensRadius: 0.045, frameThickness: 0.008, offsetY: -0.02 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('glassesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('左右レンズ(トーラス2個)+フレーム(ブリッジ+テンプル、直方体3個)ぶんの頂点を持つ', () => {
    // TorusGeometry(radialSegments=8, tubularSegments=16)は既定で (8+1)*(16+1)=153頂点。
    // BoxGeometry は既定で24頂点。2つの mergeGeometry(レンズ2つ→フレームと結合)の
    // どちらかが片方の引数を取り違えていれば頂点数がずれるため、この検証で両方の結合が
    // 正しく行われていると分かる。
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    expect(geom!.getAttribute('position').count).toBe(153 * 2 + 24 * 3);
  });

  it('左右のレンズが X方向に対称に配置される(negatedLensSpacing の符号反転が正しい)', () => {
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(-geom!.boundingBox!.min.x, 5);
  });

  it('レンズの半径+管の太さ(frameThickness × Half)ぶんY方向に広がる', () => {
    // フレーム側(ブリッジ/テンプル)の Y方向の広がりは frameThickness よりずっと薄いため、
    // 全体の bounding box の Y方向の広がりはレンズ(トーラス)側で決まる。これは
    // frameThicknessHalf(numberMultiply)の計算と leftTorusGen/rightTorusGen への配線が
    // 正しいことの検証になる。
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const expectedMaxY = DEFAULTS.lensRadius + DEFAULTS.frameThickness / 2 + DEFAULTS.offsetY;
    expect(geom!.boundingBox!.max.y).toBeCloseTo(expectedMaxY, 2);
  });
});
