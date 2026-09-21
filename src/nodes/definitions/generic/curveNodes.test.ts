import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FunctionCurve } from '../../../geometry/functionCurve';
import { EasedLatheCurve } from '../../../geometry/latheProfile';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });
const curve = (f: (t: number) => number) => ({ type: 'curve' as const, value: new FunctionCurve(f) });
const yAt = (result: ReturnType<ReturnType<typeof getNodeType>['evaluate']>, t: number) => {
  const out = result.curve;
  if (out?.type !== 'curve') throw new Error('curve が出力されていない');
  return out.value.getPoint(t);
};

describe('FunctionCurve', () => {
  it('(t, f(t)) を返す', () => {
    expect(new FunctionCurve((t) => t * 2).getPoint(0.25)).toEqual(new THREE.Vector2(0.25, 0.5));
  });
});

describe('rampCurve', () => {
  it('y = t の曲線を出力する', () => {
    expect(yAt(getNodeType('rampCurve').evaluate({}, {}), 0.3)).toEqual(new THREE.Vector2(0.3, 0.3));
  });
});

describe('scaleCurveY', () => {
  it('Y だけを factor 倍する(x は変わらない)', () => {
    const p = yAt(getNodeType('scaleCurveY').evaluate({ curve: curve((t) => t), factor: num(-2) }, {}), 0.5);
    expect(p.x).toBe(0.5);
    expect(p.y).toBeCloseTo(-1, 12);
  });

  it('curve が未接続なら何も出力しない', () => {
    expect(getNodeType('scaleCurveY').evaluate({ factor: num(2) }, {})).toEqual({});
  });
});

describe('translateCurveY', () => {
  it('Y だけを y ぶん平行移動する', () => {
    expect(yAt(getNodeType('translateCurveY').evaluate({ curve: curve((t) => t), y: num(1) }, {}), 0.25).y).toBeCloseTo(1.25, 12);
  });
});

describe('multiplyCurveY', () => {
  it('2つの曲線の Y を、同じ t の位置ごとに掛ける', () => {
    const result = getNodeType('multiplyCurveY').evaluate({ curveA: curve((t) => t), curveB: curve((t) => t) }, {});
    expect(yAt(result, 0.5).y).toBeCloseTo(0.25, 12);
  });

  it('どちらかが未接続なら何も出力しない', () => {
    expect(getNodeType('multiplyCurveY').evaluate({ curveA: curve((t) => t) }, {})).toEqual({});
  });
});

describe('Y だけを加工するノードは、入力の曲線の x(半径など)を変えない', () => {
  const path = { type: 'curve' as const, value: new EasedLatheCurve(0.4, 0.2, 1, 'up') };

  it('scaleCurveY / translateCurveY', () => {
    const scaled = yAt(getNodeType('scaleCurveY').evaluate({ curve: path, factor: num(2) }, {}), 1);
    const moved = yAt(getNodeType('translateCurveY').evaluate({ curve: path, y: num(-3) }, {}), 1);
    expect(scaled.x).toBeCloseTo(0.2, 12);
    expect(scaled.y).toBeCloseTo(2, 12);
    expect(moved.x).toBeCloseTo(0.2, 12);
    expect(moved.y).toBeCloseTo(-2, 12);
  });
});
