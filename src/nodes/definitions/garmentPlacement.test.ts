import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../registry';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from '../../geometry/body';
import './garmentPlacement';

function makeGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0); // 底面が原点に来るように寄せておく(現実のガーメントに近い形)
  return geometry;
}

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

    const anchors = computeBodyAnchors(computeBodyLayout(computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 })));
    const expectedY = anchors.waist.y + 0.03;

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
    const anchors = computeBodyAnchors(computeBodyLayout(computeBodyDimensions({ heightScale: 1, buildScale: 1, shoulderScale: 1 })));

    expect(result.geometry?.type).toBe('geometry');
    const translated = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    const box = new THREE.Box3().setFromBufferAttribute(translated!.getAttribute('position') as THREE.BufferAttribute);
    expect(box.min.y).toBeCloseTo(anchors.waist.y, 5);
  });

  it('geometryが未接続なら出力は空になる', () => {
    const result = getNodeType('garmentPlacement').evaluate({}, {});
    expect(result.geometry).toBeUndefined();
  });
});
