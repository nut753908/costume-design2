import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
// bodyGroup の埋め込みサブグラフが参照する bodyTorsoGenerator/bodyHeadGenerator/
// bodyLimbGenerator/translateY/toonMaterial/sceneOutput を含め、全ノードタイプを登録する。
import '../definitions';

// bodyGroup は寸法・配置の計算(bodyDimensionsGroup/bodyLayoutGroup)を内部に持たず、
// state/initialGraph.ts 側のトップレベル共有ノードが計算済みの生の値(半径・長さ・Y座標)を
// 外部ソケットとして直接受け取るだけになっている(bodyGroupNode.ts のコメント参照)。
describe('bodyGroup', () => {
  it('未接続でも(groupInput ソケット自身のデフォルトにより)胴体/頭/腕/脚の4パーツが描画対象として出力される', () => {
    const result = getNodeType('bodyGroup').evaluate({}, {});
    for (let i = 0; i < 4; i++) {
      expect(result[`sceneOutputGeometry${i}`]?.type).toBe('geometry');
      expect(result[`sceneOutputMaterial${i}`]?.type).toBe('material');
    }
    expect(result.sceneOutputGeometry4).toBeUndefined();
  });

  it('torsoRadius が大きくなるほど胴体(パーツ0)のジオメトリが外側に広がる', () => {
    const narrow = getNodeType('bodyGroup').evaluate({ torsoRadius: { type: 'number', value: 0.2 } }, {});
    const wide = getNodeType('bodyGroup').evaluate({ torsoRadius: { type: 'number', value: 0.3 } }, {});
    const narrowGeom = narrow.sceneOutputGeometry0?.type === 'geometry' ? narrow.sceneOutputGeometry0.value : undefined;
    const wideGeom = wide.sceneOutputGeometry0?.type === 'geometry' ? wide.sceneOutputGeometry0.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('headCenterY が大きくなるほど頭(パーツ1)の中心Yが上がる', () => {
    const lowResult = getNodeType('bodyGroup').evaluate({ headCenterY: { type: 'number', value: 1.5 } }, {});
    const highResult = getNodeType('bodyGroup').evaluate({ headCenterY: { type: 'number', value: 2.0 } }, {});
    const lowGeom = lowResult.sceneOutputGeometry1?.type === 'geometry' ? lowResult.sceneOutputGeometry1.value : undefined;
    const highGeom = highResult.sceneOutputGeometry1?.type === 'geometry' ? highResult.sceneOutputGeometry1.value : undefined;
    lowGeom!.computeBoundingBox();
    highGeom!.computeBoundingBox();
    expect(highGeom!.boundingBox!.max.y).toBeGreaterThan(lowGeom!.boundingBox!.max.y);
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
