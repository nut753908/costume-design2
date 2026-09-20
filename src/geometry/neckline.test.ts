import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { necklineWeight } from './neckline';

const HALF_WIDTH = Math.PI / 3;

/** x=0〜1 を steps 分割して y=f(x) を取った曲線(ノードグラフ側で作られる落ち込み量の点列に相当)。 */
const curve = (f: (t: number) => number, steps = 12) =>
  Array.from({ length: steps + 1 }, (_, k) => new THREE.Vector2(k / steps, f(k / steps)));

const round = curve((t) => 1 - t * t);
const v = curve((t) => 1 - t);
const square = curve(() => 1);

describe('necklineWeight', () => {
  it('曲線が空なら常に0(ネックラインを彫り込まない)', () => {
    expect(necklineWeight([], 0)).toBe(0);
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

  it('点と点の間は線形補間される', () => {
    const line = [new THREE.Vector2(0, 1), new THREE.Vector2(1, 0)];
    expect(necklineWeight(line, 0.25 * HALF_WIDTH)).toBeCloseTo(0.75, 10);
    expect(necklineWeight(line, 0.5 * HALF_WIDTH)).toBeCloseTo(0.5, 10);
  });

  it('曲線の範囲外(x の最大値より先)は端の値で頭打ちになる', () => {
    const short = [new THREE.Vector2(0, 1), new THREE.Vector2(0.5, 0.4)];
    expect(necklineWeight(short, 0.9 * HALF_WIDTH)).toBeCloseTo(0.4, 10);
  });
});
