import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { buildAlignedBox } from '../../../geometry/alignedBox';
import './alignedBoxGenerator';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

describe('alignedBoxGenerator', () => {
  it('start/end の座標から geometry/alignedBox.ts の buildAlignedBox() と一致するジオメトリを作る', () => {
    const result = getNodeType('alignedBoxGenerator').evaluate(
      {
        width: num(0.04),
        thickness: num(0.015),
        startX: num(0.08),
        startY: num(0),
        startZ: num(0.05),
        endX: num(-0.26),
        endY: num(-0.55),
        endZ: num(0.18),
      },
      {},
    );
    const geom = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    const expected = buildAlignedBox(0.04, 0.015, new THREE.Vector3(0.08, 0, 0.05), new THREE.Vector3(-0.26, -0.55, 0.18));
    geom!.computeBoundingBox();
    expected.computeBoundingBox();
    expect(geom!.getAttribute('position').count).toBe(expected.getAttribute('position').count);
    expect(geom!.boundingBox!.min).toEqual(expected.boundingBox!.min);
    expect(geom!.boundingBox!.max).toEqual(expected.boundingBox!.max);
  });

  it('start と end が同じ点なら長さ0(退化した)ジオメトリになる', () => {
    const result = getNodeType('alignedBoxGenerator').evaluate(
      { width: num(1), thickness: num(1), startX: num(0), startY: num(0), startZ: num(0), endX: num(0), endY: num(0), endZ: num(0) },
      {},
    );
    const geom = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(0, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(0, 5);
  });

  it('未接続の入力はすべて0にフォールバックする(退化した点状のジオメトリになる)', () => {
    const result = getNodeType('alignedBoxGenerator').evaluate({}, {});
    expect(result.geometry?.type).toBe('geometry');
  });
});
