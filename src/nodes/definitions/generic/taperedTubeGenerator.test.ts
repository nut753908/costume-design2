import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function tube(type: string, inputs: Record<string, ReturnType<typeof num>>, data = {}) {
  const def = getNodeType(type);
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

describe('taperedEllipseTubeGenerator', () => {
  it('segments 分割の楕円断面になる(既定は data の segments)', () => {
    expect(tube('taperedEllipseTubeGenerator', { ...INPUTS, segments: num(8) }).getAttribute('position').count).toBe(2 * 9);
    expect(tube('taperedEllipseTubeGenerator', INPUTS).getAttribute('position').count).toBe(2 * 13);
  });

  it('segments は3未満に丸まらない', () => {
    expect(tube('taperedEllipseTubeGenerator', { ...INPUTS, segments: num(1) }).getAttribute('position').count).toBe(2 * 4);
  });
});

describe('taperedRectTubeGenerator', () => {
  it('4隅の矩形断面になる', () => {
    expect(tube('taperedRectTubeGenerator', INPUTS).getAttribute('position').count).toBe(2 * 5);
  });

  it('segments ソケットを持たない', () => {
    expect(getNodeType('taperedRectTubeGenerator').inputs.some((s) => s.id === 'segments')).toBe(false);
  });

  it('始点・終点の X/Y/Z と各端の幅・厚みを取り違えない', () => {
    const geometry = tube('taperedRectTubeGenerator', {
      ...INPUTS,
      startX: num(1),
      startZ: num(2),
      endX: num(1),
      endZ: num(2),
      endY: num(-3),
    });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.max.y).toBeCloseTo(0, 6);
    expect(box.min.y).toBeCloseTo(-3, 6);
    expect(box.max.x).toBeCloseTo(1 + 0.2, 6);
    expect(box.max.z).toBeCloseTo(2 + 0.1, 6);
  });
});
