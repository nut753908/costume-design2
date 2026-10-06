import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyGroup の埋め込みサブグラフが参照する torsoShape/sphereGenerator/
// cylinderGenerator/mirrorPair/translate/mergeGeometry/toonShadowMaterial/sceneOutput を
// 含め、全ノードタイプを登録する。
import '../../definitions';

// bodyGroup の寸法と胴体/頭/腕/脚のY座標は、どれも外部ソケットで、未接続なら固定値が既定値になる
// (bodyGroupNode.ts のコメント参照)。
// 胴体/頭/腕/脚の4パーツは mergeGeometry で1つのジオメトリへ結合してから単一の
// sceneOutput へ配線しているため、描画対象は常に1パーツ(インデックス0)だけになる。
// 寸法(半径・長さ・間隔)は外部ソケットで、未接続なら固定値が既定値になる。
const inputs = (values: Record<string, number>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { type: 'number' as const, value }]));

describe('bodyGroup', () => {
  it('未接続でも結合済みの1パーツが描画対象として出力される', () => {
    const result = getNodeType('bodyGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.sceneOutputGeometry1).toBeUndefined();
  });

  it('torsoRadius が大きくなるほど結合済みジオメトリ全体が外側に広がる', () => {
    const narrow = getNodeType('bodyGroup').evaluate(inputs({ torsoRadius: 0.2 }), {});
    const wide = getNodeType('bodyGroup').evaluate(inputs({ torsoRadius: 0.3 }), {});
    const narrowGeom = narrow.sceneOutputGeometry0?.type === 'geometry' ? narrow.sceneOutputGeometry0.value : undefined;
    const wideGeom = wide.sceneOutputGeometry0?.type === 'geometry' ? wide.sceneOutputGeometry0.value : undefined;
    narrowGeom!.computeBoundingBox();
    wideGeom!.computeBoundingBox();
    expect(wideGeom!.boundingBox!.max.x).toBeGreaterThan(narrowGeom!.boundingBox!.max.x);
  });

  it('neckLength を大きくすると、その分だけ頭が上がる(頭の位置は寸法から内部で求める)', () => {
    const topOf = (neckLength: number) => {
      const result = getNodeType('bodyGroup').evaluate(inputs({ neckLength }), {});
      const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
      geom!.computeBoundingBox();
      return geom!.boundingBox!.max.y;
    };
    expect(topOf(0.1) - topOf(0)).toBeCloseTo(0.1, 5);
  });

  it('legHeight を大きくすると、その分だけ全体の上端(頭)が上がる', () => {
    const topOf = (legHeight: number) => {
      const result = getNodeType('bodyGroup').evaluate(inputs({ legHeight }), {});
      const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
      geom!.computeBoundingBox();
      return geom!.boundingBox!.max.y;
    };
    expect(topOf(0.7) - topOf(0.5)).toBeCloseTo(0.2, 5);
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
