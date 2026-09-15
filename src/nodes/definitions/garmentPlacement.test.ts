import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../registry';
// garmentPlacement の埋め込みサブグラフが参照する bodyDimensionsGroup/bodyLayoutGroup/
// anchorSelect/numberAdd/translateY を含め、全ノードタイプを登録する。
import '../definitions';

function makeGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0); // 底面が原点に来るように寄せておく(現実のガーメントに近い形)
  return geometry;
}

// bodyDimensionsGroup/bodyLayoutGroup の既定値(BASE_DIMENSIONS 相当、
// bodyDimensionsGroupNode.test.ts/bodyLayoutGroupNode.test.ts と同じ基準値)から
// waistY(= legHeight)を手計算した期待値。heightScale/buildScale/shoulderScale が
// すべて1のとき: legHeight=0.85 → waistY=0.85。
const WAIST_Y_AT_DEFAULT_SCALE = 0.85;

describe('garmentPlacement', () => {
  it('anchor+offsetYが指す座標だけジオメトリを平行移動する(等倍スケール)', () => {
    const geometry = makeGeometry();
    const before = geometry.clone();
    const result = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometry },
        anchor: { type: 'enum', value: 'waist' },
        offsetY: { type: 'number', value: 0.03 },
        bodyHeight: { type: 'number', value: 1 },
        bodyBuild: { type: 'number', value: 1 },
        bodyShoulder: { type: 'number', value: 1 },
      },
      {},
    );

    const expectedY = WAIST_Y_AT_DEFAULT_SCALE + 0.03;

    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(translated).toBeDefined();

    const beforeBox = new THREE.Box3().setFromBufferAttribute(before.getAttribute('position') as THREE.BufferAttribute);
    const afterBox = new THREE.Box3().setFromBufferAttribute(translated!.getAttribute('position') as THREE.BufferAttribute);
    expect(afterBox.min.y - beforeBox.min.y).toBeCloseTo(expectedY, 5);
  });

  it('bodyBuild等が変わるとアンカー座標も変わり、平行移動量も変わる', () => {
    const geometryDefault = makeGeometry();
    const geometryScaled = makeGeometry();

    const resultDefault = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometryDefault },
        anchor: { type: 'enum', value: 'shoulder' },
        offsetY: { type: 'number', value: 0 },
        bodyHeight: { type: 'number', value: 1 },
        bodyBuild: { type: 'number', value: 1 },
        bodyShoulder: { type: 'number', value: 1 },
      },
      {},
    );
    const resultScaled = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometryScaled },
        anchor: { type: 'enum', value: 'shoulder' },
        offsetY: { type: 'number', value: 0 },
        bodyHeight: { type: 'number', value: 1.2 },
        bodyBuild: { type: 'number', value: 1 },
        bodyShoulder: { type: 'number', value: 1 },
      },
      {},
    );

    const yDefault =
      resultDefault.geometry?.type === 'geometry'
        ? new THREE.Box3().setFromBufferAttribute(resultDefault.geometry.value.getAttribute('position') as THREE.BufferAttribute).min.y
        : undefined;
    const yScaled =
      resultScaled.geometry?.type === 'geometry'
        ? new THREE.Box3().setFromBufferAttribute(resultScaled.geometry.value.getAttribute('position') as THREE.BufferAttribute).min.y
        : undefined;

    expect(yDefault).toBeDefined();
    expect(yScaled).toBeDefined();
    expect(yScaled).not.toBeCloseTo(yDefault!, 5);
  });

  it('未接続なら anchor は waist、offsetY/body系は既定値(0/1)にフォールバックする', () => {
    const geometry = makeGeometry();
    const result = getNodeType('garmentPlacement').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});

    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    const box = new THREE.Box3().setFromBufferAttribute(translated!.getAttribute('position') as THREE.BufferAttribute);
    expect(box.min.y).toBeCloseTo(WAIST_Y_AT_DEFAULT_SCALE, 5);
  });

  it('geometryが未接続なら出力は空になる', () => {
    const result = getNodeType('garmentPlacement').evaluate({}, {});
    expect(result.geometry).toBeUndefined();
  });
});
