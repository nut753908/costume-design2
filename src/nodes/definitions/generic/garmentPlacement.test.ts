import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
// garmentPlacement の埋め込みサブグラフが参照する numberAdd/translateY を含め、
// 全ノードタイプを登録する。
import '../../definitions';

function makeGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0); // 底面が原点に来るように寄せておく(現実のガーメントに近い形)
  return geometry;
}

describe('garmentPlacement', () => {
  it('anchorY+offsetYの合計だけジオメトリを平行移動する', () => {
    const geometry = makeGeometry();
    const before = geometry.clone();
    const result = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometry },
        anchorY: { type: 'number', value: 0.85 },
        offsetY: { type: 'number', value: 0.03 },
      },
      {},
    );

    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    expect(translated).toBeDefined();

    const beforeBox = new THREE.Box3().setFromBufferAttribute(before.getAttribute('position') as THREE.BufferAttribute);
    const afterBox = new THREE.Box3().setFromBufferAttribute(translated!.getAttribute('position') as THREE.BufferAttribute);
    expect(afterBox.min.y - beforeBox.min.y).toBeCloseTo(0.88, 5);
  });

  it('anchorYが変わると平行移動量も変わる', () => {
    const geometryLow = makeGeometry();
    const geometryHigh = makeGeometry();

    const resultLow = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometryLow },
        anchorY: { type: 'number', value: 0.85 },
        offsetY: { type: 'number', value: 0 },
      },
      {},
    );
    const resultHigh = getNodeType('garmentPlacement').evaluate(
      {
        geometry: { type: 'geometry', value: geometryHigh },
        anchorY: { type: 'number', value: 1.92 },
        offsetY: { type: 'number', value: 0 },
      },
      {},
    );

    const yLow =
      resultLow.geometry?.type === 'geometry'
        ? new THREE.Box3().setFromBufferAttribute(resultLow.geometry.value.getAttribute('position') as THREE.BufferAttribute).min.y
        : undefined;
    const yHigh =
      resultHigh.geometry?.type === 'geometry'
        ? new THREE.Box3().setFromBufferAttribute(resultHigh.geometry.value.getAttribute('position') as THREE.BufferAttribute).min.y
        : undefined;

    expect(yLow).toBeDefined();
    expect(yHigh).toBeDefined();
    expect(yHigh).toBeGreaterThan(yLow!);
  });

  it('未接続なら anchorY/offsetY は既定値0にフォールバックする', () => {
    const geometry = makeGeometry();
    const result = getNodeType('garmentPlacement').evaluate({ geometry: { type: 'geometry', value: geometry } }, {});

    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    const box = new THREE.Box3().setFromBufferAttribute(translated!.getAttribute('position') as THREE.BufferAttribute);
    expect(box.min.y).toBeCloseTo(0, 5);
  });

  it('geometryが未接続なら出力は空になる', () => {
    const result = getNodeType('garmentPlacement').evaluate({}, {});
    expect(result.geometry).toBeUndefined();
  });
});
