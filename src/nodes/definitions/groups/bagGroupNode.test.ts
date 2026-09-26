import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bagGroup の埋め込みサブグラフが参照する alignedBoxGenerator/boxGenerator/numberSubtract/
// numberMultiply/translate/mergeGeometry/toonMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// ストラップ(ノードグラフ側の alignedBoxGenerator)とバッグ本体(ノードグラフ側の
// boxGenerator+translate、bagCenter = strapEnd + (0, -bagHeight/2, 0) を四則演算
// チェーンで導出)を merge で1つにまとめる配線が正しいかを検証する(bagGroupNode.ts の
// コメント参照)。寸法パラメータはグループ内部の numberInput に閉じており、外部から注入できる
// のは torsoRadius だけ(体の側面の位置と前面の深さに掛かる)。それ以外は既定値での評価結果を検証する。
describe('bagGroup', () => {
  const DEFAULTS = { torsoRadius: 0.26, hipOffsetRatio: 1, frontDepthRatio: 0.69, drop: 0.55, bagWidth: 0.16, bagHeight: 0.14, bagDepth: 0.08 };

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
    // 片方だけしか配線されていない(mergeGeometry の geometries へ片方を繋ぎ忘れた等の)
    // 配線ミスがあれば24のままになるため、この検証だけで両方が結合されていると分かる。
    expect(geom!.getAttribute('position').count).toBe(48);
  });

  it('バッグ本体は bagCenterY(= -drop - bagHeight/2)の高さまで垂れ下がる', () => {
    // ストラップ自身の最下点(y = -drop = -0.55)より、バッグ本体の底(bagCenterY -
    // bagHeight/2 = -0.69)の方が低いため、全体の bounding box の下端はバッグ本体側で決まる。
    // これは negatedDrop/halfBagHeight/bagCenterY の四則演算チェーンが正しい値を計算し、
    // translate の Y へ正しく配線されていることの検証になる。
    const result = getNodeType('bagGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const expectedBottom = -DEFAULTS.drop - DEFAULTS.bagHeight / 2 - DEFAULTS.bagHeight / 2;
    expect(geom!.boundingBox!.min.y).toBeCloseTo(expectedBottom, 2);
  });

  it('バッグ本体は bagFrontDepthCalc(= 0.69 × torsoRadius、ストラップの終端 endZ と共有する値)の深さに置かれる', () => {
    // ストラップの厚み(thickness=0.015)よりバッグ本体の奥行き(depth=0.08)の方が大きいため、
    // 全体の bounding box の最大Z(手前側)はバッグ本体側で決まる。translate の Z への配線が
    // 正しいことの検証になる。
    const result = getNodeType('bagGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    const bagFrontDepth = DEFAULTS.frontDepthRatio * DEFAULTS.torsoRadius;
    const expectedMaxZ = bagFrontDepth + DEFAULTS.bagDepth / 2;
    expect(geom!.boundingBox!.max.z).toBeCloseTo(expectedMaxZ, 2);
  });

  it('torsoRadius に比例して、体の側面の位置(Hip Offset)と前面の深さ(Bag Front Depth)が外へ動く', () => {
    const bounds = (torsoRadius?: number) => {
      const result = getNodeType('bagGroup').evaluate(torsoRadius === undefined ? {} : { torsoRadius: { type: 'number', value: torsoRadius } }, {});
      const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
      geom!.computeBoundingBox();
      return geom!.boundingBox!;
    };
    const base = bounds();
    const delta = 0.1;
    const wide = bounds(DEFAULTS.torsoRadius + delta);
    // バッグ本体は x = -1.0 × torsoRadius、z = 0.69 × torsoRadius を中心に置かれる(幅・奥行きは不変)。
    expect(wide.min.x - base.min.x).toBeCloseTo(-DEFAULTS.hipOffsetRatio * delta, 2);
    expect(wide.max.z - base.max.z).toBeCloseTo(DEFAULTS.frontDepthRatio * delta, 2);
  });
});
