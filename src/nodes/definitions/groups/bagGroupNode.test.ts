import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bagGroup の埋め込みサブグラフが参照する alignedBoxGenerator/boxGenerator/numberSubtract/
// numberMultiply/translateX/translateY/translateZ/mergeGeometry/toonMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// ストラップ(ノードグラフ側の alignedBoxGenerator)とバッグ本体(ノードグラフ側の
// boxGenerator+translateX/Y/Z、bagCenter = strapEnd + (0, -bagHeight/2, 0) を四則演算
// チェーンで導出)を merge で1つにまとめる配線が正しいかを検証する(bagGroupNode.ts の
// コメント参照)。全パラメータがグループ内部の numberInput に閉じており groupInput 経由
// では外部から注入できないため、既定値での評価結果を検証する。
describe('bagGroup', () => {
  const DEFAULTS = { hipOffset: 0.26, drop: 0.55, bagWidth: 0.16, bagHeight: 0.14, bagDepth: 0.08 };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('bagGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('ストラップとバッグ本体、両方ぶんの頂点を持つ(mergeGeometry が両方を正しく結合している)', () => {
    const result = getNodeType('bagGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    // ストラップ(alignedBoxGenerator = BoxGeometry)+本体(boxGenerator = BoxGeometry)は
    // どちらも24頂点(面ごとに頂点を共有しない既定の BoxGeometry)なので、結合後は48。
    // 片方だけしか配線されていない(mergeGeometry の geometryA/geometryB を取り違えた等の)
    // 配線ミスがあれば24のままになるため、この検証だけで両方が結合されていると分かる。
    expect(geom!.getAttribute('position').count).toBe(48);
  });

  it('バッグ本体は bagCenterY(= -drop - bagHeight/2)の高さまで垂れ下がる', () => {
    // ストラップ自身の最下点(y = -drop = -0.55)より、バッグ本体の底(bagCenterY -
    // bagHeight/2 = -0.69)の方が低いため、全体の bounding box の下端はバッグ本体側で決まる。
    // これは negatedDrop/halfBagHeight/bagCenterY の四則演算チェーンが正しい値を計算し、
    // translateY へ正しく配線されていることの検証になる。
    const result = getNodeType('bagGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const expectedBottom = -DEFAULTS.drop - DEFAULTS.bagHeight / 2 - DEFAULTS.bagHeight / 2;
    expect(geom!.boundingBox!.min.y).toBeCloseTo(expectedBottom, 2);
  });

  it('バッグ本体は bagFrontDepthIn(= 0.18、ストラップの終端 endZ と共有する固定値)の深さに置かれる', () => {
    // ストラップの厚み(thickness=0.015)よりバッグ本体の奥行き(depth=0.08)の方が大きいため、
    // 全体の bounding box の最大Z(手前側)はバッグ本体側で決まる。translateZ への配線が
    // 正しいことの検証になる。
    const result = getNodeType('bagGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const bagFrontDepth = 0.18;
    const expectedMaxZ = bagFrontDepth + DEFAULTS.bagDepth / 2;
    expect(geom!.boundingBox!.max.z).toBeCloseTo(expectedMaxZ, 2);
  });
});
