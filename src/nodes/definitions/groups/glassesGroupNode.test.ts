import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// glassesGroup の埋め込みサブグラフが参照する alignedBoxGenerator/torusGenerator/
// numberAdd/numberSubtract/translate/mirrorPair/mergeGeometry/
// toonMaterial/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';

// 左右のレンズ(torusGenerator+translate を mirrorPair で ±lensSpacing へ複製)と、
// ブリッジ+左右テンプル(alignedBoxGenerator のブリッジ1本+テンプル1本を mirrorPair で
// 複製)を mergeGeometry で1つにまとめる配線が正しいかを検証する(glassesGroupNode.ts のコメント参照)。全パラメータがグループ内部の
// numberInput に閉じており groupInput 経由では外部から注入できないため、既定値での
// 評価結果を検証する。
describe('glassesGroup', () => {
  // offsetYIn の既定値(-0.02)ぶん、garmentPlacement が最終的な geometry 全体をY方向へ
  // 平行移動する(anchorY はここでは未接続のため0にフォールバックする)。
  const DEFAULTS = { lensRadius: 0.08, frameThickness: 0.008, offsetY: -0.02 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('glassesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('左右レンズ(トーラス2個)+フレーム(ブリッジ+テンプル、直方体3個)ぶんの頂点を持つ', () => {
    // TorusGeometry(radialSegments=8, tubularSegments=16)は既定で (8+1)*(16+1)=153頂点。
    // BoxGeometry は既定で24頂点。ブリッジ・テンプルペア(templeMirror)・レンズペア(lensMirror)を
    // mergeAll で結合する。mirrorPair/mergeGeometry のどこか1つでも取り違えていれば
    // 頂点数がずれるため、この検証で全部が正しく結合されていると分かる。
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    expect(geom!.getAttribute('position').count).toBe(153 * 2 + 24 * 3);
  });

  it('左右のレンズ/テンプルが X方向に対称に配置される(mirrorPair の ±offset が正しい)', () => {
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(-geom!.boundingBox!.min.x, 5);
  });

  it('レンズの半径+管の太さ(frameThickness × Half)ぶんY方向に広がる', () => {
    // フレーム側(ブリッジ/テンプル)の Y方向の広がりは frameThickness よりずっと薄いため、
    // 全体の bounding box の Y方向の広がりはレンズ(トーラス)側で決まる。これは
    // frameThicknessHalf(numberHalf)の計算と lensGen への配線が正しいことの検証になる。
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const expectedMaxY = DEFAULTS.lensRadius + DEFAULTS.frameThickness / 2 + DEFAULTS.offsetY;
    expect(geom!.boundingBox!.max.y).toBeCloseTo(expectedMaxY, 2);
  });

  it('テンプルが前面(Z=forwardDepth)から後方 templeBackZ まで伸びる', () => {
    // レンズは Z=forwardDepth(ボディの基準の頭半径 + 0.01)付近だけにあるため、全体の最小 Z はテンプルの後端
    // (templeBackZ = (forwardDepth - 0.02) - 0.12)で決まる。alignedBox の太さは軸に垂直な方向にだけ
    // 広がるので、後端はちょうど templeBackZ になる。
    const result = getNodeType('glassesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.z).toBeCloseTo(BODY_DIMENSIONS.headRadius + 0.01 - 0.02 - 0.12, 5);
  });
});
