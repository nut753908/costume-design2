import { describe, expect, it } from 'vitest';
import { necklineWeight } from './neckline';

const HALF_WIDTH = Math.PI / 3;
const TYPES = ['round', 'v', 'square'] as const;

describe('necklineWeight', () => {
  it('正面(angle=0)ではどのタイプも最大値1になる', () => {
    for (const type of TYPES) {
      expect(necklineWeight(type, 0)).toBeCloseTo(1, 10);
    }
  });

  it('half-width(π/3)ちょうどでは round/v は0になる(自然にゼロへ収束する式のため)', () => {
    expect(necklineWeight('round', HALF_WIDTH)).toBeCloseTo(0, 10);
    expect(necklineWeight('v', HALF_WIDTH)).toBeCloseTo(0, 10);
  });

  it('half-width ちょうどでは square だけ1のまま(判定が `> HALF_WIDTH` で半開区間のため、境界を含む)', () => {
    expect(necklineWeight('square', HALF_WIDTH)).toBe(1);
    // ごくわずかでも超えると0に切り替わる(ステップ関数)。
    expect(necklineWeight('square', HALF_WIDTH + 1e-9)).toBe(0);
  });

  it('half-width を超えると0のまま', () => {
    for (const type of TYPES) {
      expect(necklineWeight(type, HALF_WIDTH + 0.1)).toBe(0);
      expect(necklineWeight(type, Math.PI)).toBe(0);
    }
  });

  it('負の角度に対しても左右対称になる', () => {
    for (const type of TYPES) {
      for (const angle of [0.1, 0.3, 0.5]) {
        expect(necklineWeight(type, angle)).toBeCloseTo(necklineWeight(type, -angle), 10);
      }
    }
  });

  it('2πを超える角度は正規化されて扱われる(col が angleSegments に近いときの実際の使われ方)', () => {
    const normalizedNegative = necklineWeight('round', -0.1);
    const wrapped = necklineWeight('round', Math.PI * 2 - 0.1);
    expect(wrapped).toBeCloseTo(normalizedNegative, 10);
  });

  it('round は2次関数(1 - t^2)で滑らかに減衰する', () => {
    const t = 0.5;
    expect(necklineWeight('round', t * HALF_WIDTH)).toBeCloseTo(1 - t * t, 10);
  });

  it('v は線形(1 - t)で減衰する', () => {
    const t = 0.5;
    expect(necklineWeight('v', t * HALF_WIDTH)).toBeCloseTo(1 - t, 10);
  });

  it('square は half-width の内側では常に1(ステップ関数)', () => {
    for (const t of [0, 0.3, 0.6, 0.99]) {
      expect(necklineWeight('square', t * HALF_WIDTH)).toBe(1);
    }
  });

  it('同じ角度(0 < angle < half-width)では v が最も浅く、square が最も深い(v <= round <= square)', () => {
    // weight が大きいほど彫り込みが深い(necklineDepth * weight で使われる)。1-t^2 は
    // t∈(0,1) で常に 1-t 以上になる(t^2 <= t)ため、round は v より減衰が緩やかで
    // weight が大きく残る。square は範囲内では常に1なので必ず最大。
    const angle = 0.4;
    const v = necklineWeight('v', angle);
    const round = necklineWeight('round', angle);
    const square = necklineWeight('square', angle);
    expect(v).toBeLessThanOrEqual(round);
    expect(round).toBeLessThanOrEqual(square);
  });
});
