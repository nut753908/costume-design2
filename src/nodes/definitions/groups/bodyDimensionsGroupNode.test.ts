import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// bodyDimensionsGroup の埋め込みサブグラフが参照する numberInput/numberMultiply を含め、
// 全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// heightScale/shoulderScale は bodyDimensions からしか参照されない単独パラメータのため、
// グループ内部の numberInput(heightScaleIn/shoulderScaleIn、既定値1)として持ち、外部からは
// 注入できない(scarfGroupNode.test.ts と同じ「全パラメータが内部の numberInput に閉じている」
// 扱い)。buildScale だけが9ガーメントへ直接ファンアウトする共有値のため、引き続き groupInput
// 経由で外部から注入できる。
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
});
