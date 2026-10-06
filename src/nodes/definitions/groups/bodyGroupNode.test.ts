import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyGroup の埋め込みサブグラフが参照する torsoShape/sphereGenerator/
// cylinderGenerator/mirrorPair/translate/mergeGeometry/toonShadowMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// bodyGroup の寸法は内部の固定値(numberInput)で、配置Y座標だけを state/initialGraph.ts 側の
// 共有ノード bodyLayout から外部ソケットとして受け取る(bodyGroupNode.ts のコメント参照)。
// 胴体/頭/腕/脚の4パーツは mergeGeometry で1つのジオメトリへ結合してから単一の
// sceneOutput へ配線しているため、描画対象は常に1パーツ(インデックス0)だけになる。
// 寸法は内部の numberInput ノード(id は寸法名)の入力欄の値。テストではその値を差し替えた data で評価する。
function dataWith(values: Record<string, number>) {
  const template = getNodeType('bodyGroup').createDefaultData() as { nodes: { id: string; data: Record<string, unknown> }[] };
  return { ...template, nodes: template.nodes.map((n) => (n.id in values ? { ...n, data: { ...n.data, value: values[n.id] } } : n)) };
}

describe('bodyGroup', () => {
  it('未接続でも結合済みの1パーツが描画対象として出力される', () => {
    const result = getNodeType('bodyGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.sceneOutputGeometry1).toBeUndefined();
  });

  it('寸法 torsoRadius の値が大きくなるほど結合済みジオメトリ全体が外側に広がる', () => {
    const narrow = getNodeType('bodyGroup').evaluate({}, dataWith({ torsoRadius: 0.2 }));
    const wide = getNodeType('bodyGroup').evaluate({}, dataWith({ torsoRadius: 0.3 }));
    const narrowGeom = narrow.sceneOutputGeometry0?.type === 'geometry' ? narrow.sceneOutputGeometry0.value : undefined;
    const wideGeom = wide.sceneOutputGeometry0?.type === 'geometry' ? wide.sceneOutputGeometry0.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('首は胴体の延長として作られ、neckLength の 2.4 倍だけ胴体の上端が高くなる', () => {
    const topOf = (neckLength: number) => {
      const result = getNodeType('bodyGroup').evaluate({}, dataWith({ torsoRadius: 0.15, torsoLength: 0.3, neckLength }));
      const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
      geom!.computeBoundingBox();
      return geom!.boundingBox!.max.y;
    };
    // 胴体は股(原点)を支点に `torsoTilt` の角度だけ後ろへ傾いているので、延長の分は cos(傾き) 倍だけ上がる。
    const tilt = (getNodeType('bodyGroup').createDefaultData() as { nodes: { id: string; data: { x: number } }[] }).nodes.find(
      (n) => n.id === 'torsoTilt',
    )!.data.x;
    const rise = topOf(0.1) - topOf(0);
    expect(rise).toBeGreaterThan(2.4 * 0.1 * Math.cos((tilt * Math.PI) / 180) - 0.02);
    expect(rise).toBeLessThan(2.4 * 0.1 + 0.02);
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

  it('color ソケットの既定値(#fae6da)が結合済みメッシュのマテリアルに使われ、注入した色で上書きできる', () => {
    const colorOf = (inputs: Parameters<ReturnType<typeof getNodeType>['evaluate']>[0]) => {
      const material = getNodeType('bodyGroup').evaluate(inputs, {}).sceneOutputMaterial0;
      return material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color.getHexString() : undefined;
    };
    expect(colorOf({})).toBe(new THREE.Color('#fae6da').getHexString());
    expect(colorOf({ color: { type: 'color', value: new THREE.Color('#112233') } })).toBe('112233');
  });
});
