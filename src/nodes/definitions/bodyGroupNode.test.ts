import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
// bodyGroup の埋め込みサブグラフが参照する bodyDimensions/bodyLayout/bodyTorsoGenerator/
// bodyHeadGenerator/bodyLimbGenerator/translateY/toonMaterial/sceneOutput を含め、
// 全ノードタイプを登録する。
import '../definitions';

describe('bodyGroup', () => {
  it('未接続でも(groupInput ソケット自身のデフォルトにより)胴体/頭/腕/脚の4パーツが描画対象として出力される', () => {
    const result = getNodeType('bodyGroup').evaluate({}, {});
    for (let i = 0; i < 4; i++) {
      expect(result[`sceneOutputGeometry${i}`]?.type).toBe('geometry');
      expect(result[`sceneOutputMaterial${i}`]?.type).toBe('material');
    }
    expect(result.sceneOutputGeometry4).toBeUndefined();
  });

  it('bodyBuild が大きくなるほど胴体(パーツ0)のジオメトリが外側に広がる', () => {
    const narrow = getNodeType('bodyGroup').evaluate({ bodyBuild: { type: 'number', value: 0.9 } }, {});
    const wide = getNodeType('bodyGroup').evaluate({ bodyBuild: { type: 'number', value: 1.3 } }, {});
    const narrowGeom = narrow.sceneOutputGeometry0?.type === 'geometry' ? narrow.sceneOutputGeometry0.value : undefined;
    const wideGeom = wide.sceneOutputGeometry0?.type === 'geometry' ? wide.sceneOutputGeometry0.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('bodyHeight が大きくなるほど頭(パーツ1)の中心Yが上がる', () => {
    const shortResult = getNodeType('bodyGroup').evaluate({ bodyHeight: { type: 'number', value: 0.85 } }, {});
    const tallResult = getNodeType('bodyGroup').evaluate({ bodyHeight: { type: 'number', value: 1.2 } }, {});
    const shortGeom = shortResult.sceneOutputGeometry1?.type === 'geometry' ? shortResult.sceneOutputGeometry1.value : undefined;
    const tallGeom = tallResult.sceneOutputGeometry1?.type === 'geometry' ? tallResult.sceneOutputGeometry1.value : undefined;
    shortGeom!.computeBoundingBox();
    tallGeom!.computeBoundingBox();
    expect(tallGeom!.boundingBox!.max.y).toBeGreaterThan(shortGeom!.boundingBox!.max.y);
  });

  it('内部の skinColorIn(デフォルト #f2c9a0)が4パーツすべてのマテリアルへファンアウトされる', () => {
    // Skin Color は bodyGroup 以外と共有されない単独パラメータのため groupInput の外部
    // ソケットではなく内部の colorInput ノード(skinColorIn)として保持している
    // (bodyGroupNode.ts 参照)。外部からは注入できないため、既定値がそのまま使われることを
    // 検証する。
    const result = getNodeType('bodyGroup').evaluate({}, {});
    for (let i = 0; i < 4; i++) {
      const material = result[`sceneOutputMaterial${i}`];
      const color = material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color : undefined;
      expect(color?.getHexString()).toBe(new THREE.Color('#f2c9a0').getHexString());
    }
  });
});
