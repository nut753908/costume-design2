import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

function geometryOf() {
  const result = getNodeType('glassesTemplePair').evaluate({}, {});
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  result.geometry.value.computeBoundingBox();
  return result.geometry.value;
}

describe('glassesTemplePair', () => {
  it('直方体2本ぶんの頂点を持つ(BoxGeometry の既定は24頂点)', () => {
    expect(geometryOf().getAttribute('position').count).toBe(24 * 2);
  });

  it('左右が X方向に対称で、前面(forwardDepth=0.14)から後方 templeBackZ(=0)まで Z方向に伸びる', () => {
    const box = geometryOf().boundingBox!;
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
    expect(box.max.z).toBeCloseTo(0.14, 5);
    expect(box.min.z).toBeCloseTo(0, 5);
  });
});
