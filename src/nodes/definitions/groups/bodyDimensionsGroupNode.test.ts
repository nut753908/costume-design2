import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// 全ノードタイプを登録する。
import '../../definitions';

function num(v: number) {
  return { type: 'number' as const, value: v };
}

// 各値は `groupOutput` のソケットの入力欄の値(基準値)がそのまま出力される。
const BASE = {
  legHeight: 0.5754,
  legRadius: 0.0691,
  legSpacing: 0.1109,
  torsoLength: 0.3343,
  torsoRadius: 0.1536,
  headRadius: 0.2966,
  armLength: 0.4683,
  armRadius: 0.0523,
  shoulderSpacing: 0.1443,
  neckLength: 0.0565,
  neckRadius: 0.0525,
};

describe('bodyDimensionsGroup', () => {
  it('基準値がそのまま出力される', () => {
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
});
