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
  };

  it('legCenterY = legHeight / 2', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.legCenterY).toEqual(num(0.425));
  });

  it('torsoCenterY = waistY + (torsoLength + torsoRadius*2) / 2', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.torsoCenterY).toEqual(num(1.385));
  });

  it('headCenterY = waistY + (torsoLength + torsoRadius*2) + headRadius', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.headCenterY).toEqual(num(2.08));
  });

  it('armCenterY = shoulderY - armLength/2 - torsoRadius*0.4', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate(inputs, {});
    expect(result.armCenterY?.type === 'number' && result.armCenterY.value).toBeCloseTo(1.506, 10);
  });

  it('未接続なら全入力が0扱いになり、全出力も0になる', () => {
    const result = getNodeType('bodyLayoutGroup').evaluate({}, {});
    expect(result.legCenterY).toEqual(num(0));
    expect(result.torsoCenterY).toEqual(num(0));
    expect(result.headCenterY).toEqual(num(0));
    expect(result.armCenterY).toEqual(num(0));
  });
});
