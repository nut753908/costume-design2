import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyDimensionsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply を含め、
// 全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// buildScale/heightScale/shoulderScale はどれも groupInput の外部ソケットで、未接続なら既定値1になる。
const BASE = {
  legHeight: 0.62,
  legRadius: 0.051,
  legSpacing: 0.092,
  torsoLength: 0.33,
  torsoRadius: 0.153,
  headRadius: 0.289,
  armLength: 0.5,
  armRadius: 0.0425,
  shoulderSpacing: 0.122,
  neckLength: 0.02,
  neckRadius: 0.048,
};

describe('bodyDimensionsGroup', () => {
  it('未接続なら heightScale/buildScale/shoulderScale が1として基準値(BASE_DIMENSIONS)がそのまま出力される', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({}, {});
    expect(result.legHeight).toEqual(num(BASE.legHeight));
    expect(result.legRadius).toEqual(num(BASE.legRadius));
    expect(result.legSpacing).toEqual(num(BASE.legSpacing));
    expect(result.torsoLength).toEqual(num(BASE.torsoLength));
    expect(result.torsoRadius).toEqual(num(BASE.torsoRadius));
    expect(result.headRadius).toEqual(num(BASE.headRadius));
    expect(result.armLength).toEqual(num(BASE.armLength));
    expect(result.armRadius).toEqual(num(BASE.armRadius));
    expect(result.shoulderSpacing).toEqual(num(BASE.shoulderSpacing));
    expect(result.neckLength).toEqual(num(BASE.neckLength));
    expect(result.neckRadius).toEqual(num(BASE.neckRadius));
  });

  it('buildScale は半径・間隔(shoulderSpacing含む)をスケールし、headRadius・縦方向には影響しない', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ buildScale: num(2) }, {});
    expect(result.legRadius).toEqual(num(BASE.legRadius * 2));
    expect(result.torsoRadius).toEqual(num(BASE.torsoRadius * 2));
    expect(result.armRadius).toEqual(num(BASE.armRadius * 2));
    expect(result.shoulderSpacing).toEqual(num(BASE.shoulderSpacing * 2));
    expect(result.neckRadius).toEqual(num(BASE.neckRadius * 2));
    expect(result.headRadius).toEqual(num(BASE.headRadius));
    expect(result.legHeight).toEqual(num(BASE.legHeight));
  });

  it('heightScale は縦方向の長さ(legHeight/torsoLength/armLength/neckLength)だけをスケールする', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ heightScale: num(1.2) }, {});
    expect(result.legHeight).toEqual(num(BASE.legHeight * 1.2));
    expect(result.torsoLength).toEqual(num(BASE.torsoLength * 1.2));
    expect(result.armLength).toEqual(num(BASE.armLength * 1.2));
    expect(result.neckLength).toEqual(num(BASE.neckLength * 1.2));
    expect(result.legRadius).toEqual(num(BASE.legRadius));
    expect(result.shoulderSpacing).toEqual(num(BASE.shoulderSpacing));
  });

  it('shoulderScale は shoulderSpacing だけをスケールする', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ shoulderScale: num(1.5) }, {});
    expect(result.shoulderSpacing).toEqual(num(BASE.shoulderSpacing * 1.5));
    expect(result.legHeight).toEqual(num(BASE.legHeight));
    expect(result.torsoRadius).toEqual(num(BASE.torsoRadius));
  });
});
