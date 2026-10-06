import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { expectOutwardWinding } from '../../../geometry/windingTestHelpers';
// necktieGroup の埋め込みサブグラフが参照する numberInput/colorInput/boxGenerator/translate/
// taperedRectTubeGenerator/mergeGeometry/toonMaterial/translate/sceneOutput を含め、全ノードタイプを登録する。
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import '../../definitions';

// necktie は結び目(boxGenerator+translate)とブレード(taperedRectTubeGenerator)を mergeGeometry で
// 結合する(necktieGroupNode.ts のコメント参照)。寸法はグループ内部の numberInput に閉じ、
// 前面の深さ(Front Depth)だけが BODY_DIMENSIONS.torsoRadius × 1.15 の固定値で決まる。既定値での評価結果の
// バウンディングボックスで、各パラメータの配線先(X/Y/Z・幅/厚み)を検証する。
describe('necktieGroup', () => {
  const DEFAULTS = {
    knotWidth: 0.05,
    knotHeight: 0.04,
    knotThickness: 0.025,
    bladeTopWidth: 0.035,
    bladeBottomWidth: 0.06,
    bladeThickness: 0.008,
    bladeLength: 0.3,
    frontDepth: 1.15 * BODY_DIMENSIONS.torsoRadius,
    y: 1.1769,
  };

  const geometryOf = (inputs: Record<string, { type: 'number'; value: number }> = {}) => {
    const result = getNodeType('necktieGroup').evaluate(inputs, {});
    return result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
  };

  it('描画対象として出力される', () => {
    const result = getNodeType('necktieGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('結び目は胸の上端(取り付け位置 y、既定 1.1769)にあり、ブレードはその下へ knotHeight + bladeLength まで垂れる', () => {
    const geom = geometryOf()!;
    geom.computeBoundingBox();
    expect(geom.boundingBox!.max.y).toBeCloseTo(DEFAULTS.y, 5);
    expect(geom.boundingBox!.min.y).toBeCloseTo(DEFAULTS.y - (DEFAULTS.knotHeight + DEFAULTS.bladeLength), 5);
  });

  it('X方向の広がりは結び目とブレード下端の広い方、Z方向は frontDepth を中心にした厚みで決まる', () => {
    const geom = geometryOf()!;
    geom.computeBoundingBox();
    expect(geom.boundingBox!.max.x).toBeCloseTo(DEFAULTS.bladeBottomWidth / 2, 5);
    expect(geom.boundingBox!.min.x).toBeCloseTo(-DEFAULTS.bladeBottomWidth / 2, 5);
    expect(geom.boundingBox!.max.z).toBeCloseTo(DEFAULTS.frontDepth + DEFAULTS.knotThickness / 2, 5);
    expect(geom.boundingBox!.min.z).toBeCloseTo(DEFAULTS.frontDepth - DEFAULTS.knotThickness / 2, 5);
  });

  it('ブレード(キャップ無しの矩形チューブ)は結び目を除いて外向きの巻き順になっている', () => {
    // 結び目(BoxGeometry)は上面・下面を持つためチューブ基準の放射判定は当てはまらない。
    // 結び目は自身の中心、ブレードは前面(Z=frontDepth)を通る Y軸方向の軸を基準に判定する。
    const knotCenter = new THREE.Vector3(0, DEFAULTS.y - DEFAULTS.knotHeight / 2, DEFAULTS.frontDepth);
    const KNOT_INDEX_COUNT = 36; // BoxGeometry は既定で6面×2三角形×3 = 36 indices
    expectOutwardWinding(geometryOf()!, (centroid, i) =>
      i < KNOT_INDEX_COUNT ? knotCenter : new THREE.Vector3(0, centroid.y, DEFAULTS.frontDepth),
    );
  });

  it('Color ソケットの既定値(#7a1f2b)が sceneOutputMaterial0 に使われる', () => {
    const result = getNodeType('necktieGroup').evaluate({}, {});
    const material = result.sceneOutputMaterial0;
    const color = material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color : undefined;
    expect(color?.getHexString()).toBe(new THREE.Color('#7a1f2b').getHexString());
  });

});
