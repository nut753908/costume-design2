import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import './bodyLayout';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const value = (result: Record<string, unknown>, key: string) => (result[key] as { value: number }).value;

describe('bodyLayout', () => {
  const inputs = {
    legHeight: num(0.85),
    torsoLength: num(0.5),
    torsoRadius: num(0.2),
    headRadius: num(0.3),
    armLength: num(0.6),
  };

  it('waistY は脚の高さ、legCenterY はその半分', () => {
    const result = getNodeType('bodyLayout').evaluate(inputs, {});
    expect(value(result, 'waistY')).toBeCloseTo(0.85, 10);
    expect(value(result, 'legCenterY')).toBeCloseTo(0.425, 10);
  });

  it('headCenterY = 肩(脚の高さ + 胴体の長さ + 半径 × 2) + 首の長さ(内部の固定値 0.0565) + 頭の半径', () => {
    const result = getNodeType('bodyLayout').evaluate(inputs, {});
    expect(value(result, 'headCenterY')).toBeCloseTo(0.85 + 0.5 + 0.4 + 0.0565 + 0.3, 10);
  });

  it('armCenterY = 肩 − 腕の長さ/2 − 胴体の半径 × 0.8', () => {
    const result = getNodeType('bodyLayout').evaluate(inputs, {});
    expect(value(result, 'armCenterY')).toBeCloseTo(0.85 + 0.5 + 0.4 - 0.3 - 0.16, 10);
  });

  it('未接続なら全入力が0扱いになり、首の固定値(0.0565)だけが頭の中心に残る', () => {
    const result = getNodeType('bodyLayout').evaluate({}, {});
    for (const key of ['legCenterY', 'waistY', 'armCenterY']) expect(value(result, key)).toBe(0);
    expect(value(result, 'headCenterY')).toBeCloseTo(0.0565, 10);
  });
});
