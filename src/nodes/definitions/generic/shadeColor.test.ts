import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './shadeColor';

const num = (value: number) => ({ type: 'number' as const, value });
const colorOf = (inputs: Record<string, ReturnType<typeof num> | { type: 'color'; value: THREE.Color }>) => {
  const out = getNodeType('shadeColor').evaluate(inputs as never, {}).color;
  return out?.type === 'color' ? out.value.getHexString() : undefined;
};

describe('shadeColor', () => {
  it('色の R・G・B に倍率を掛ける(見た目の色で)', () => {
    expect(colorOf({ color: { type: 'color', value: new THREE.Color('#fae6da') }, r: num(1), g: num(1), b: num(1) })).toBe('fae6da');
    expect(colorOf({ color: { type: 'color', value: new THREE.Color('#808080') }, r: num(0.5), g: num(1), b: num(0) })).toBe('408000');
  });

  it('既定の倍率で、参照の肌の明るい面 #fae6da が濃い影 #f0c9ae 付近になる', () => {
    const hex = colorOf({ color: { type: 'color', value: new THREE.Color('#fae6da') } })!;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    expect(Math.abs(r - 0xf0)).toBeLessThanOrEqual(2);
    expect(Math.abs(g - 0xc9)).toBeLessThanOrEqual(2);
    expect(Math.abs(b - 0xae)).toBeLessThanOrEqual(2);
  });
});
