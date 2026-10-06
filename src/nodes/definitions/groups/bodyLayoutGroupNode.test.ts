import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
// bodyLayoutGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/numberAdd/
// numberSubtract を含め、全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

const value = (r: Record<string, { type: string; value?: unknown }>, key: string) => (r[key] as { value: number }).value;

// ボディの寸法(BODY_DIMENSIONS)から、配置の式を手計算した期待値と突き合わせる。
describe('bodyLayoutGroup', () => {
  const { legHeight, torsoLength, torsoRadius, headRadius, armLength, neckLength } = BODY_DIMENSIONS;
  const shoulderY = legHeight + torsoLength + torsoRadius * 2;

  it('legCenterY = legHeight / 2', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(value(result, 'legCenterY')).toBeCloseTo(legHeight / 2, 10);
  });

  it('shoulderY = waistY + 胴体のカプセルの高さ(torsoLength + 2 × torsoRadius)', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(value(result, 'shoulderY')).toBeCloseTo(shoulderY, 10);
  });

  it('headCenterY = shoulderY + neckLength + headRadius', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(value(result, 'headCenterY')).toBeCloseTo(shoulderY + neckLength + headRadius, 10);
  });

  it('armCenterY = shoulderY - armLength/2 - torsoRadius*0.8', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(value(result, 'armCenterY')).toBeCloseTo(shoulderY - armLength / 2 - torsoRadius * 0.8, 10);
  });

  it('feetY を変えると、feetY・waistY・体のすべての Y 座標が同じだけ連動して動く', () => {
    const base = getNodeType('bodyLayoutGroup').evaluate({}, {});
    const raised = getNodeType('bodyLayoutGroup').evaluate({ feetY: num(0.3) }, {});
    expect(value(raised, 'feetY')).toBeCloseTo(0.3, 10);
    for (const key of ['waistY', 'legCenterY', 'headCenterY', 'armCenterY', 'shoulderY', 'wristY']) {
      expect(value(raised, key) - value(base, key), key).toBeCloseTo(0.3, 10);
    }
  });

  it('feetY の既定値は 0 で、waistY = legHeight になる', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(result.feetY).toEqual(num(0));
    expect(value(result, 'waistY')).toBeCloseTo(legHeight, 10);
  });
});
