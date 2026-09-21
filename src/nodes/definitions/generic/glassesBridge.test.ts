import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

describe('glassesBridge', () => {
  const result = getNodeType('glassesBridge').evaluate({}, {});
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  const geometry = result.geometry.value;
  geometry.computeBoundingBox();

  it('直方体1本ぶんの頂点を持つ(BoxGeometry の既定は24頂点)', () => {
    expect(geometry.getAttribute('position').count).toBe(24);
  });

  it('X方向に対称で、両端は ±(lensSpacing-lensRadius)=±0.01 に収まる', () => {
    const box = geometry.boundingBox!;
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
    expect(box.max.x).toBeCloseTo(0.01, 5);
  });
});
