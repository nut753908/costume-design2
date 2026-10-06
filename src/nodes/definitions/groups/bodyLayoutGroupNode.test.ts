import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyLayoutGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/numberAdd/
// numberSubtract を含め、全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// bodyDimensionsGroup の既定値(BASE_DIMENSIONS)と同じ入力で、computeBodyLayout() の式を
// 手計算した期待値と突き合わせる。
describe('bodyLayoutGroup', () => {
  const inputs = {
    legHeight: num(0.85),
    torsoLength: num(0.55),
    torsoRadius: num(0.26),
    headRadius: num(0.16),
    armLength: num(0.62),
    neckLength: num(0.06),
  };

  it('legCenterY = legHeight / 2', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.legCenterY).toEqual(num(0.425));
  });

  it('headCenterY = shoulderY + neckLength + headRadius', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.headCenterY?.type === 'number' && result.headCenterY.value).toBeCloseTo(2.14, 10);
  });

  it('armCenterY = shoulderY - armLength/2 - torsoRadius*0.8', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.armCenterY?.type === 'number' && result.armCenterY.value).toBeCloseTo(1.402, 10);
  });

  it('feetY を変えると、feetY・waistY・体のすべての Y 座標が同じだけ連動して動く', () => {
    const base = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    const raised = getNodeType('bodyLayoutGroup').evaluate({ ...inputs, feetY: num(0.3) }, {});
    const value = (r: Record<string, { type: string; value?: unknown }>, key: string) => (r[key] as { value: number }).value;
    expect(value(raised, 'feetY')).toBeCloseTo(0.3, 10);
    for (const key of ['waistY', 'legCenterY', 'headCenterY', 'armCenterY', 'shoulderY', 'wristY']) {
      expect(value(raised, key) - value(base, key), key).toBeCloseTo(0.3, 10);
    }
  });

  it('feetY の既定値は 0 で、waistY = legHeight になる', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.feetY).toEqual(num(0));
    expect(result.waistY).toEqual(num(0.85));
  });

  it('未接続なら全入力が0扱いになり、全出力も0になる', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(result.legCenterY).toEqual(num(0));
    expect(result.headCenterY).toEqual(num(0));
    expect(result.armCenterY).toEqual(num(0));
  });
});
