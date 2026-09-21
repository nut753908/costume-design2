import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

function geometryOf(inputs: Record<string, { type: 'number'; value: number }> = {}) {
  const result = getNodeType('glassesLensPair').evaluate(inputs, {});
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  result.geometry.value.computeBoundingBox();
  return result.geometry.value;
}

describe('glassesLensPair', () => {
  it('トーラス2個ぶんの頂点を持つ(TorusGeometry の既定は (8+1)*(16+1)=153頂点)', () => {
    expect(geometryOf().getAttribute('position').count).toBe(153 * 2);
  });

  it('左右のレンズが X方向に対称に、±(lensSpacing+lensRadius+管の太さ/2)まで広がる', () => {
    const box = geometryOf().boundingBox!;
    expect(box.max.x).toBeCloseTo(-box.min.x, 5);
    expect(box.max.x).toBeCloseTo(0.055 + 0.045 + 0.008 / 2, 5);
  });

  it('forwardDepth に追従して Z方向へ平行移動する', () => {
    const z = (forwardDepth: number) => geometryOf({ forwardDepth: { type: 'number', value: forwardDepth } }).boundingBox!.max.z;
    expect(z(0.3) - z(0.14)).toBeCloseTo(0.16, 5);
  });
});
