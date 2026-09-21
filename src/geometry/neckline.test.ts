import { describe, expect, it } from 'vitest';
import { FunctionCurve } from './functionCurve';
import { necklineWeight } from './neckline';

const HALF_WIDTH = Math.PI / 3;

/** y=f(x) の曲線(ノードグラフ側で作られる落ち込み量の曲線に相当)。 */
const curve = (f: (t: number) => number) => new FunctionCurve(f);

const round = curve((t) => 1 - t * t);
const v = curve((t) => 1 - t);
const square = curve(() => 1);

describe('necklineWeight', () => {
  it('曲線が未接続なら常に0(ネックラインを彫り込まない)', () => {
    expect(necklineWeight(undefined, 0)).toBe(0);
  });

  it('正面(angle=0)では曲線の先頭の値になる', () => {
    for (const weights of [round, v, square]) {
      expect(necklineWeight(weights, 0)).toBeCloseTo(1, 10);
    }
  });

  it('half-width(π/3)ちょうどでは曲線の終端の値になる(round/v は0、square は1のまま)', () => {
    expect(necklineWeight(round, HALF_WIDTH)).toBeCloseTo(0, 10);
    expect(necklineWeight(v, HALF_WIDTH)).toBeCloseTo(0, 10);
    expect(necklineWeight(square, HALF_WIDTH)).toBe(1);
  });

  it('half-width を超えると曲線によらず0(square はここでステップ状に切り替わる)', () => {
    expect(necklineWeight(square, HALF_WIDTH + 1e-9)).toBe(0);
    for (const weights of [round, v, square]) {
      expect(necklineWeight(weights, HALF_WIDTH + 0.1)).toBe(0);
      expect(necklineWeight(weights, Math.PI)).toBe(0);
    }
  });

  it('負の角度に対しても左右対称になる', () => {
    for (const angle of [0.1, 0.3, 0.5]) {
      expect(necklineWeight(round, angle)).toBeCloseTo(necklineWeight(round, -angle), 10);
    }
  });

  it('2πを超える角度は正規化されて扱われる(col が angleSegments に近いときの実際の使われ方)', () => {
    expect(necklineWeight(round, Math.PI * 2 - 0.1)).toBeCloseTo(necklineWeight(round, -0.1), 10);
  });

  it('曲線を分割せず、角度ごとにそのまま評価する(直線なら途中の値も厳密)', () => {
    expect(necklineWeight(v, 0.25 * HALF_WIDTH)).toBeCloseTo(0.75, 12);
    expect(necklineWeight(v, 0.5 * HALF_WIDTH)).toBeCloseTo(0.5, 12);
    expect(necklineWeight(round, 0.5 * HALF_WIDTH)).toBeCloseTo(0.75, 12);
  });
});
