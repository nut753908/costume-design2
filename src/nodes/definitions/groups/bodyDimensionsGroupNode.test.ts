import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyDimensionsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply を含め、
// 全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// buildScale/heightScale/shoulderScale はどれも groupInput の外部ソケットで、未接続なら既定値1になる。
describe('bodyDimensionsGroup', () => {
  it('未接続なら heightScale/buildScale/shoulderScale が1として基準値(BASE_DIMENSIONS)がそのまま出力される', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({}, {});
    expect(result.legHeight).toEqual(num(0.85));
    expect(result.legRadius).toEqual(num(0.11));
    expect(result.legSpacing).toEqual(num(0.14));
    expect(result.torsoLength).toEqual(num(0.55));
    expect(result.torsoRadius).toEqual(num(0.26));
    expect(result.headRadius).toEqual(num(0.16));
    expect(result.armLength).toEqual(num(0.62));
    expect(result.armRadius).toEqual(num(0.075));
    expect(result.shoulderSpacing).toEqual(num(0.34));
  });

  it('buildScale は半径・間隔(shoulderSpacing含む)をスケールし、headRadius・縦方向には影響しない', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ buildScale: num(2) }, {});
    expect(result.legRadius).toEqual(num(0.11 * 2));
    expect(result.torsoRadius).toEqual(num(0.26 * 2));
    expect(result.armRadius).toEqual(num(0.075 * 2));
    expect(result.shoulderSpacing).toEqual(num(0.34 * 2));
    expect(result.headRadius).toEqual(num(0.16));
    expect(result.legHeight).toEqual(num(0.85));
  });

  it('heightScale は縦方向の長さ(legHeight/torsoLength/armLength)だけをスケールする', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ heightScale: num(1.2) }, {});
    expect(result.legHeight).toEqual(num(0.85 * 1.2));
    expect(result.torsoLength).toEqual(num(0.55 * 1.2));
    expect(result.armLength).toEqual(num(0.62 * 1.2));
    expect(result.legRadius).toEqual(num(0.11));
    expect(result.shoulderSpacing).toEqual(num(0.34));
  });

  it('shoulderScale は shoulderSpacing だけをスケールする', () => {
    const result = getNodeType('bodyDimensionsGroup').evaluate({ shoulderScale: num(1.5) }, {});
    expect(result.shoulderSpacing).toEqual(num(0.34 * 1.5));
    expect(result.legHeight).toEqual(num(0.85));
    expect(result.torsoRadius).toEqual(num(0.26));
  });
});
