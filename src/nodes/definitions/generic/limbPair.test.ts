import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

// `end*` で始まる入力は先端の球(`limbEnd`)の入力へ(`endRatio` → `ratio` など)、それ以外は `limbPair` へ渡す。
function evaluateBox(inputs: Record<string, number>) {
  // 軸は `armShaft`(中心が原点、高さ length)を `radius`/`length` で作って渡す。
  const shaft = getNodeType('armShaft').evaluate({ radius: num(inputs.radius), length: num(inputs.length) }, {}).geometry;
  const endInputs: Record<string, ReturnType<typeof num>> = { radius: num(inputs.radius) };
  const pairInputs: Record<string, ReturnType<typeof num>> = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (k.startsWith('end')) endInputs[k.charAt(3).toLowerCase() + k.slice(4)] = num(v);
    else if (k !== 'radius') pairInputs[k] = num(v);
  }
  const end = getNodeType('limbEnd').evaluate(endInputs, {}).geometry;
  const result = getNodeType('limbPair').evaluate({ ...pairInputs, shaft, end }, {});
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

  it('endShiftX は先端の球を(端の半径を単位に)外側へずらし、endRoll は左右へ傾ける', () => {
    const flat = evaluateBox({ ...base, endRatio: 1.2, endScaleX: 2, endScaleY: 0.5 });
    // 球は X に2倍、Y に半分: 外側へ 1 × 0.12 だけずらすと、外側の端がその分だけ広がる。
    const shifted = evaluateBox({ ...base, endRatio: 1.2, endScaleX: 2, endScaleY: 0.5, endShiftX: 1 });
    expect(shifted.max.x).toBeCloseTo(flat.max.x + 0.12, 5);
    // 90 度傾けると、X に長い楕円体が縦に長くなり、先端が下へ伸びる。
    const rolled = evaluateBox({ ...base, endRatio: 1.2, endScaleX: 2, endScaleY: 0.5, endRoll: 90 });
    expect(rolled.min.y).toBeLessThan(flat.min.y - 0.05);
  });

  it('footX は足だけを(外側を+として)左右へずらし、軸は動かさない', () => {
    const bbox = (footX: number) => {
      const shaft = getNodeType('armShaft').evaluate({ radius: num(0.1), length: num(0.6) }, {}).geometry;
      const foot = { type: 'geometry' as const, value: new THREE.BoxGeometry(0.05, 0.05, 0.05) };
      const end = getNodeType('limbEnd').evaluate({ radius: num(0.1), ratio: num(0.01) }, {}).geometry;
      const inputs = { length: num(0.6), spacing: num(0.3), centerY: num(1), footX: num(footX), shaft, end, foot };
      const g = (getNodeType('limbPair').evaluate(inputs, {}).geometry as { value: THREE.BufferGeometry }).value;
      g.computeBoundingBox();
      return g.boundingBox!;
    };
    // 外側へ 0.2 ずらすと全体の右端が広がる。内側へずらしても、右端は軸が決めるので変わらない。
    expect(bbox(-0.05).min.x).toBeCloseTo(bbox(0).min.x, 5);
    expect(bbox(0.2).max.x).toBeGreaterThan(bbox(0).max.x + 0.1);
    expect(bbox(-0.2).max.x).toBeCloseTo(bbox(0).max.x, 5);
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
