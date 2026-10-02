import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyGroup の埋め込みサブグラフが参照する torsoShape/sphereGenerator/
// cylinderGenerator/mirrorPair/translate/mergeGeometry/toonMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// bodyGroup は寸法・配置の計算(bodyDimensionsGroup/bodyLayoutGroup)を内部に持たず、
// state/initialGraph.ts 側のトップレベル共有ノードが計算済みの生の値(半径・長さ・Y座標)を
// 外部ソケットとして直接受け取るだけになっている(bodyGroupNode.ts のコメント参照)。
// 胴体/頭/腕/脚の4パーツは mergeGeometry で1つのジオメトリへ結合してから単一の
// sceneOutput へ配線しているため、描画対象は常に1パーツ(インデックス0)だけになる。
describe('bodyGroup', () => {
  it('未接続でも(groupInput ソケット自身のデフォルトにより)結合済みの1パーツが描画対象として出力される', () => {
    const result = getNodeType('bodyGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.sceneOutputGeometry1).toBeUndefined();
  });

  it('torsoRadius が大きくなるほど結合済みジオメトリ全体が外側に広がる', () => {
    const narrow = getNodeType('bodyGroup').evaluate({ torsoRadius: { type: 'number', value: 0.2 } }, {});
    const wide = getNodeType('bodyGroup').evaluate({ torsoRadius: { type: 'number', value: 0.3 } }, {});
    const narrowGeom = narrow.sceneOutputGeometry0?.type === 'geometry' ? narrow.sceneOutputGeometry0.value : undefined;
    const wideGeom = wide.sceneOutputGeometry0?.type === 'geometry' ? wide.sceneOutputGeometry0.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('首は neckCenterY を中心に、首の長さの2倍の高さ(上下を頭と胴体に食い込ませる)で結合される', () => {
    const result = getNodeType('bodyGroup').evaluate(
      {
        neckRadius: { type: 'number', value: 0.05 },
        neckLength: { type: 'number', value: 0.1 },
        neckCenterY: { type: 'number', value: 3 },
      },
      {},
    );
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    // 他のパーツは未接続(寸法0・原点付近)なので、上端は首の上端で決まる。首は中心を支点に
    // `neckTilt` の角度だけ前へ傾いているので、上端の縁は 半高さ × cos + 半径 × sin だけ中心より上にある。
    const tilt = (getNodeType('bodyGroup').createDefaultData() as { nodes: { id: string; data: { x: number } }[] }).nodes.find(
      (n) => n.id === 'neckTilt',
    )!.data.x;
    const theta = (tilt * Math.PI) / 180;
    // 首の上端は丸く閉じていて、傾けると広がった上端の縁が頂点より少し上に出るので、半高さ × cos(傾き) を中心に
    // ±0.02 の範囲で確かめる。
    expect(geom!.boundingBox!.max.y).toBeGreaterThan(3 + 0.1 * Math.cos(theta) - 0.02);
    expect(geom!.boundingBox!.max.y).toBeLessThan(3 + 0.1 * Math.cos(theta) + 0.02);
    // 腕・脚など他のパーツも未接続(寸法 0)で位置だけが外接箱に入るので、首の半径を下限にする。
    expect(geom!.boundingBox!.max.x).toBeGreaterThanOrEqual(0.05 - 1e-5);
    expect(geom!.boundingBox!.max.x).toBeLessThan(0.15);
  });

  it('headCenterY が大きくなるほど結合済みジオメトリの上端(頭)が上がる', () => {
    const lowResult = getNodeType('bodyGroup').evaluate({ headCenterY: { type: 'number', value: 1.5 } }, {});
    const highResult = getNodeType('bodyGroup').evaluate({ headCenterY: { type: 'number', value: 2.0 } }, {});
    const lowGeom = lowResult.sceneOutputGeometry0?.type === 'geometry' ? lowResult.sceneOutputGeometry0.value : undefined;
    const highGeom = highResult.sceneOutputGeometry0?.type === 'geometry' ? highResult.sceneOutputGeometry0.value : undefined;
    lowGeom!.computeBoundingBox();
    highGeom!.computeBoundingBox();
    expect(highGeom!.boundingBox!.max.y).toBeGreaterThan(lowGeom!.boundingBox!.max.y);
  });

  it('color ソケットの既定値(#f2c9a0)が結合済みメッシュのマテリアルに使われ、注入した色で上書きできる', () => {
    const colorOf = (inputs: Parameters<ReturnType<typeof getNodeType>['evaluate']>[0]) => {
      const material = getNodeType('bodyGroup').evaluate(inputs, {}).sceneOutputMaterial0;
      return material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color.getHexString() : undefined;
    };
    expect(colorOf({})).toBe(new THREE.Color('#f2c9a0').getHexString());
    expect(colorOf({ color: { type: 'color', value: new THREE.Color('#112233') } })).toBe('112233');
  });
});
