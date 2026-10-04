import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateBox(inputs: Record<string, number>) {
  // 軸は `armShaft`(中心が原点、高さ length)を `radius`/`length` で作って渡す。
  const shaft = getNodeType('armShaft').evaluate({ radius: num(inputs.radius), length: num(inputs.length) }, {}).geometry;
  const result = getNodeType('limbPair').evaluate(
    { ...Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])), shaft },
    {},
  );
  const geometry = result.geometry?.type === 'geometry' ? result.geometry.value : undefined;
  geometry!.computeBoundingBox();
  return geometry!.boundingBox!;
}

describe('limbPair', () => {
  const base = { radius: 0.1, length: 0.6, spacing: 0.3, centerY: 1 };

  it('左右対称に ±spacing へ置かれ、根元の半径ぶん外側へ広がる', () => {
    const box = evaluateBox(base);
    // 軸の輪郭の補間でわずかに(1% 程度)はみ出しうる。
    expect(box.max.x).toBeCloseTo(0.3 + 0.1, 2);
    expect(box.min.x).toBeCloseTo(-(0.3 + 0.1), 2);
  });

  it('centerY を中心に length だけ縦に広がり、上端には radius の球(関節)、先端には既定で同じ大きさの球が付く', () => {
    const box = evaluateBox(base);
    expect(box.min.y).toBeCloseTo(1 - 0.3 - 0.1, 5);
    expect(box.max.y).toBeCloseTo(1 + 0.3 + 0.1, 5);
  });

  it('先端の球は radius × endRatio の大きさで、endScaleY/endShiftY/endShiftZ に従ってつぶれ・ずれる', () => {
    // 足: 半径 0.1 × 1.2 = 0.12、上下 0.5 倍につぶし、中心を先端から 0.5 × 0.12 だけ上、1 × 0.12 だけ前へ。
    const box = evaluateBox({ ...base, endRatio: 1.2, endScaleY: 0.5, endShiftY: 0.5, endShiftZ: 1 });
    expect(box.max.z).toBeCloseTo(0.12 + 0.12, 5);
  });

  it('swingAngle は付け根を支点に先端を外へ振り、付け根の位置は変えない', () => {
    const straight = evaluateBox(base);
    const swung = evaluateBox({ ...base, swingAngle: 30 });
    // 上端(付け根)は動かず、先端が外へ広がる。
    // 上端は軸の丸い端なので、振ると端の位置が少し(半径の1割程度)下がる。
    expect(swung.max.y).toBeCloseTo(straight.max.y, 1);
    expect(swung.max.x).toBeGreaterThan(straight.max.x + 0.1);
    expect(swung.min.x).toBeCloseTo(-swung.max.x, 5);
    // 振った分だけ先端は少し上がる。
    expect(swung.min.y).toBeGreaterThan(straight.min.y);
  });

  it('pitchAngle は付け根を支点に先端を後ろ(-Z)へ振り、付け根の位置は変えない', () => {
    const straight = evaluateBox(base);
    const pitched = evaluateBox({ ...base, pitchAngle: 30 });
    // 上端は軸の丸い端なので、振ると端の位置が少し(半径の1割程度)下がる。
    expect(pitched.max.y).toBeCloseTo(straight.max.y, 1);
    expect(pitched.min.z).toBeLessThan(straight.min.z - 0.1);
    // 負の角度なら前へ振る。
    expect(evaluateBox({ ...base, pitchAngle: -30 }).max.z).toBeGreaterThan(straight.max.z + 0.1);
  });

  it('centerZ は左右ペア全体を前後へ平行移動する', () => {
    const straight = evaluateBox(base);
    const shifted = evaluateBox({ ...base, centerZ: 0.2 });
    expect(shifted.min.z).toBeCloseTo(straight.min.z + 0.2, 5);
    expect(shifted.max.z).toBeCloseTo(straight.max.z + 0.2, 5);
  });
});
