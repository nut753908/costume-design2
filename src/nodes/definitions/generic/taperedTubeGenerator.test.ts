import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function tube(inputs: Record<string, ReturnType<typeof num> | { type: 'enum'; value: string }>, data = {}) {
  const def = getNodeType('taperedTubeGenerator');
  const result = def.evaluate(inputs, { ...def.createDefaultData(), ...data });
  if (result.geometry?.type !== 'geometry') throw new Error('geometry が出力されていない');
  return result.geometry.value;
}

const INPUTS = {
  startY: num(0),
  endY: num(-1),
  startWidth: num(0.4),
  startThickness: num(0.2),
  endWidth: num(0.2),
  endThickness: num(0.1),
};

describe('taperedTubeGenerator', () => {
  it('data の shape が既定(ellipse)なら segments 分割の楕円断面になる', () => {
    expect(tube({ ...INPUTS, segments: num(8) }).getAttribute('position').count).toBe(2 * 9);
  });

  it('shape を矩形にすると4隅の断面になる(segments は使わない)', () => {
    expect(tube(INPUTS, { shape: 'rectangle' }).getAttribute('position').count).toBe(2 * 5);
  });

  it('shape ソケットへ値が来ればそちらが data より優先される', () => {
    expect(tube({ ...INPUTS, shape: { type: 'enum', value: 'rectangle' } }).getAttribute('position').count).toBe(2 * 5);
  });

  it('始点・終点の X/Y/Z と各端の幅・厚みを取り違えない', () => {
    const geometry = tube(
      { ...INPUTS, startX: num(1), startZ: num(2), endX: num(1), endZ: num(2), endY: num(-3) },
      { shape: 'rectangle' },
    );
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.y).toBeCloseTo(0, 6);
    expect(box.min.y).toBeCloseTo(-3, 6);
    expect(box.max.x).toBeCloseTo(1 + 0.2, 6);
    expect(box.max.z).toBeCloseTo(2 + 0.1, 6);
  });
});
